import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { HUNT_MISSIONS } from '../hunt/huntLines';
import { HUNT_TEST_STANDINGS } from '../hunt/huntTestStandings';
import { HuntRange, RANGE_END_MS } from './HuntRange';
import { HIT_CLEAR_MS } from './HuntRangeTarget';
import { getRangeTargets } from './huntRangeLines';

function mockMedia({ reduced = false, mobile = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: (reduced && query.includes('prefers-reduced-motion')) || (mobile && query.includes('max-width: 639px')),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const TARGETS = getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 0);
// 0.5: never a pop-up, right-to-left, 5,1s travel (desktop).
const random = () => 0.5;

function renderRange(targets = TARGETS) {
  const onClose = vi.fn();
  const onPakFteBon = vi.fn();
  render(<HuntRange targets={targets} onClose={onClose} onPakFteBon={onPakFteBon} random={random} />);
  return { onClose, onPakFteBon };
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const liveTargets = () => screen.queryAllByRole('button', { name: /target/i }).filter((b) => !b.hasAttribute('aria-disabled') && b.closest('[data-testid="range-target"]'));
const start = () => fireEvent.click(screen.getByRole('button', { name: /start ronde/i }));

/** Shoots every target as it comes in until the result shows. */
function playRound(shoot = true) {
  for (let i = 0; i < 40 && !screen.queryByTestId('range-result'); i++) {
    advance(500);
    if (shoot) liveTargets().forEach((t) => fireEvent.click(t));
  }
}

describe('HuntRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMedia();
  });
  afterEach(() => vi.useRealTimers());

  it('opens on a briefing with the live next target', () => {
    renderRange();
    expect(screen.getByRole('dialog', { name: /hunt range/i })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('range-briefing')).toHaveTextContent('Next target: UTRECHT #9 · +0,19 FTE nodig');
    expect(screen.getByRole('button', { name: /sluit/i })).toHaveFocus();
  });

  it('targets come from the live standings, nearest first; Zwolle never appears; only the nearest is NEXT TARGET', () => {
    renderRange();
    start();
    advance(450);
    advance(950);
    const shown = screen.getAllByTestId('range-target');
    expect(shown).toHaveLength(2); // two lanes on desktop
    expect(within(shown[0]).getByRole('button')).toHaveAccessibleName('Next target Utrecht #9');
    expect(within(shown[1]).getByRole('button')).toHaveAccessibleName('Target Leeuwarden #8');
    expect(screen.queryByText(/zwolle/i, { selector: '.hr-city' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('.hr-target-next')).toHaveLength(1);
  });

  it('a click is a hit: score +1, a one-liner with the live target and the FTE needed', () => {
    renderRange();
    start();
    advance(450);
    expect(screen.getByTestId('range-hud')).toHaveTextContent('Target 1/5 · Hits 0');
    fireEvent.click(screen.getByRole('button', { name: 'Next target Utrecht #9' }));
    expect(screen.getByTestId('range-hud')).toHaveTextContent('Hits 1');
    const message = screen.getByTestId('range-hit-message');
    expect(message.querySelector('.hr-message-title')?.textContent).toBeTruthy();
    expect(message).toHaveTextContent('UTRECHT #9');
    expect(message).toHaveTextContent('Nodig: +0,19 FTE');
    // A second click on the folding target doesn't count twice.
    fireEvent.click(screen.getByRole('button', { name: 'Next target Utrecht #9' }));
    expect(screen.getByTestId('range-hud')).toHaveTextContent('Hits 1');
    advance(HIT_CLEAR_MS);
    expect(screen.queryByRole('button', { name: 'Next target Utrecht #9' })).not.toBeInTheDocument();
  });

  it('a target that slides past is a miss', () => {
    renderRange();
    start();
    advance(450);
    advance(5100);
    expect(screen.queryByRole('button', { name: 'Next target Utrecht #9' })).not.toBeInTheDocument();
    expect(screen.getByTestId('range-hud')).toHaveTextContent('Hits 0');
  });

  it('the round ends after five targets: 5/5 hit, LEKKER, FTE verdiend 0,00', () => {
    renderRange();
    start();
    playRound();
    advance(RANGE_END_MS);
    const result = screen.getByTestId('range-result');
    expect(result).toHaveTextContent('5 / 5 targets hit');
    expect(result).toHaveTextContent('LEKKER.');
    expect(screen.getByTestId('range-fte-earned')).toHaveTextContent('0,00');
    expect(result).toHaveTextContent(/tijd voor het echte werk/i);
    expect(result).toHaveTextContent(/verandert geen ranking, geen fte, geen vcdb en geen league-data/i);
  });

  it('missing everything: 0 / 5 — and still 0,00', () => {
    renderRange();
    start();
    playRound(false);
    expect(screen.getByTestId('range-result')).toHaveTextContent('0 / 5 targets hit');
    expect(screen.getByTestId('range-fte-earned')).toHaveTextContent('0,00');
  });

  it('a perfect round changes no real data: the targets and FTE needed are exactly as before', () => {
    const before = structuredClone(TARGETS);
    const standingsBefore = structuredClone(HUNT_TEST_STANDINGS);
    renderRange();
    start();
    playRound();
    expect(TARGETS).toEqual(before);
    expect(HUNT_TEST_STANDINGS).toEqual(standingsBefore);
    expect(getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 0)).toEqual(before);
  });

  it('result actions: PAK FTE-BON, a sales mission, another round, back to the Hunt Room', () => {
    const { onClose, onPakFteBon } = renderRange();
    start();
    playRound();
    fireEvent.click(screen.getByRole('button', { name: /geef mij een sales missie/i }));
    expect(HUNT_MISSIONS).toContain(screen.getByTestId('range-mission').textContent);
    fireEvent.click(screen.getByRole('button', { name: /^pak fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /nog een ronde/i }));
    expect(screen.getByTestId('range-hud')).toHaveTextContent('Target 0/5 · Hits 0');
    playRound();
    fireEvent.click(screen.getByRole('button', { name: /terug naar hunt room/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Net FTE #1: NO TARGETS REMAINING · DEFEND THE POSITION, with PAK FTE-BON', () => {
    const { onPakFteBon } = renderRange([]);
    const panel = screen.getByTestId('range-no-targets');
    expect(panel).toHaveTextContent(/no targets remaining/i);
    expect(panel).toHaveTextContent(/defend the position/i);
    expect(screen.queryByRole('button', { name: /start ronde/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /pak fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(1);
  });

  it('mobile: one lane, one target at a time', () => {
    mockMedia({ mobile: true });
    renderRange();
    start();
    advance(450);
    advance(1500);
    expect(screen.getAllByTestId('range-target')).toHaveLength(1);
    expect(document.querySelectorAll('.hr-lane')).toHaveLength(1);
  });

  it('reduced motion: a static board with all five targets, still clickable, round still ends', () => {
    mockMedia({ reduced: true });
    renderRange();
    start();
    expect(screen.getByTestId('hunt-range')).toHaveAttribute('data-reduced');
    const shown = screen.getAllByTestId('range-target');
    expect(shown).toHaveLength(5);
    shown.forEach((t) => expect(t).toHaveClass('hr-m-board'));
    advance(20000); // nothing moves away on its own
    expect(screen.getAllByTestId('range-target')).toHaveLength(5);
    shown.forEach((t) => fireEvent.click(within(t).getByRole('button')));
    expect(screen.getByTestId('range-hit-message')).toBeInTheDocument();
    advance(HIT_CLEAR_MS);
    advance(RANGE_END_MS);
    expect(screen.getByTestId('range-result')).toHaveTextContent('5 / 5 targets hit');
  });

  it('Escape and SLUIT close the range', () => {
    const { onClose } = renderRange();
    fireEvent.keyDown(screen.getByTestId('hunt-range'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /sluit/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
