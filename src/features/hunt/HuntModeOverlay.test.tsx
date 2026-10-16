import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HuntModeOverlay } from './HuntModeOverlay';
import { HUNT_MISSIONS, HUNT_ONE_LINERS } from './huntLines';

const { fetchFteBonnen } = vi.hoisted(() => ({ fetchFteBonnen: vi.fn() }));
vi.mock('../../services/fteBonnen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/fteBonnen')>()),
  fetchFteBonnen,
}));
vi.mock('../../data/manualPowerBiSnapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/manualPowerBiSnapshot')>();
  const { HUNT_TEST_STANDINGS } = await import('./huntTestStandings');
  return { ...actual, MANUAL_POWER_BI_SNAPSHOT: { updatedAt: '2026-10-13', standings: HUNT_TEST_STANDINGS } };
});

function mockMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const OPEN_BON = { id: 'a', label: 'JdV', type: 'VERLENGING', fteDelta: 0.5, owner: 'TM', note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z' };

function renderOverlay(props: Partial<Parameters<typeof HuntModeOverlay>[0]> = {}) {
  const onExit = vi.fn();
  const onPakFteBon = vi.fn();
  render(<HuntModeOverlay fromActivation={false} onExit={onExit} onPakFteBon={onPakFteBon} {...props} />);
  return { onExit, onPakFteBon };
}

const hero = () => within(screen.getByRole('region', { name: /the net fte hunt is on/i }));

describe('HuntModeOverlay — approved design: scene → target → action', () => {
  beforeEach(() => {
    mockMotion(false);
    // No cinematic files exist: the HEAD probe answers 404.
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, headers: new Headers() }) as unknown as typeof fetch;
    fetchFteBonnen.mockReset();
    fetchFteBonnen.mockResolvedValue([]);
  });

  it('opens as a modal with the headline and one live strip: VCDB, target in the centre, Net FTE', async () => {
    renderOverlay();
    expect(screen.getByRole('dialog', { name: /the net fte hunt is on/i })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/team zwolle \/\/ live intelligence/i)).toBeInTheDocument();
    expect(hero().getByRole('group', { name: 'Onze kracht · VCDB' })).toHaveTextContent('#1');
    expect(hero().getByRole('group', { name: 'De missie · Net FTE' })).toHaveTextContent('#10');
    const target = hero().getByRole('group', { name: 'Target acquired' });
    expect(target).toHaveTextContent('#9 Utrecht');
    expect(target).toHaveTextContent('+0,19 FTE');
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('target and FTE needed follow the open FTE-bonnen', async () => {
    fetchFteBonnen.mockResolvedValue([OPEN_BON]);
    renderOverlay();
    await waitFor(() => expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('#8 Leeuwarden'));
    expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('+2,39 FTE');
  });

  it('no target left: TARGET SECURED · NET FTE #1 · VASTHOUDEN', async () => {
    fetchFteBonnen.mockResolvedValue([{ ...OPEN_BON, fteDelta: 20 }]);
    renderOverlay();
    const target = await screen.findByRole('group', { name: 'Target secured' });
    expect(target).toHaveTextContent(/target secured/i);
    expect(target).toHaveTextContent('Net FTE #1');
    expect(target).toHaveTextContent(/vasthouden/i);
  });

  it('shows the three actions, the four moves as one strip and the Net FTE rule', () => {
    renderOverlay();
    for (const name of [/geef mij een missie/i, /^pak fte-bon/i, /geef me vuur/i]) expect(hero().getByRole('button', { name })).toBeInTheDocument();
    const moves = within(screen.getByRole('region', { name: /vier routes naar net fte/i }));
    for (const move of ['Verlengen', 'PO → contract', 'Nieuwe contractant', 'Uren ophogen']) expect(moves.getByText(move)).toBeInTheDocument();
    expect(screen.getByText('Net FTE = BPT + VD')).toBeInTheDocument();
    expect(screen.getByText('PO telt niet mee')).toBeInTheDocument();
    expect(screen.getByText('Net FTE = BPT + VD · PO telt niet mee')).toBeInTheDocument();
  });

  it('no permanent mission or motivation boxes in the room', () => {
    renderOverlay();
    expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
    expect(screen.queryByText(/mission brief/i)).not.toBeInTheDocument();
  });

  it('keeps the secondary intelligence below the fold: factor, final position, open bonnen, projection, Power BI date', async () => {
    fetchFteBonnen.mockResolvedValue([OPEN_BON]);
    renderOverlay();
    const intel = within(screen.getByRole('region', { name: /secundaire intelligence/i }));
    await waitFor(() => expect(intel.getByText('1 open')).toBeInTheDocument());
    expect(intel.getByText('Factor').nextSibling).toHaveTextContent('1,3x');
    expect(intel.getByText('Eindstand').nextSibling).toHaveTextContent('#2');
    expect(intel.getByText('Open FTE-bonnen').nextSibling).toHaveTextContent('+0,50');
    expect(intel.getByText('Projectie FTE-rank').nextSibling).toHaveTextContent('#9');
    expect(intel.getByText('Projectie Net FTE').nextSibling).toHaveTextContent('-7,28');
    expect(intel.getByText(/power bi 13 oct 2026/i)).toBeInTheDocument();
  });

  it('GEEF MIJ EEN MISSIE opens the reveal with a mission; NOG EEN MISSIE changes it', async () => {
    const user = userEvent.setup();
    renderOverlay();
    await user.click(hero().getByRole('button', { name: /geef mij een missie/i }));
    const reveal = within(screen.getByTestId('hunt-reveal'));
    const first = screen.getByTestId('hunt-reveal-text').dataset.text;
    expect(HUNT_MISSIONS).toContain(first);
    await user.click(reveal.getByRole('button', { name: /nog een missie/i }));
    const second = screen.getByTestId('hunt-reveal-text').dataset.text;
    expect(HUNT_MISSIONS).toContain(second);
    expect(second).not.toBe(first);
  });

  it('GEEF ME VUUR opens the reveal with a one-liner; NOG ÉÉN changes it', async () => {
    const user = userEvent.setup();
    renderOverlay();
    await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
    const first = screen.getByTestId('hunt-reveal-text').dataset.text;
    expect(HUNT_ONE_LINERS).toContain(first);
    await user.click(screen.getByRole('button', { name: /nog één/i }));
    const second = screen.getByTestId('hunt-reveal-text').dataset.text;
    expect(HUNT_ONE_LINERS).toContain(second);
    expect(second).not.toBe(first);
    expect(screen.queryByTestId('gold-confetti')).not.toBeInTheDocument();
  });

  it('Escape closes the reveal first, then Hunt Mode', async () => {
    const user = userEvent.setup();
    const { onExit } = renderOverlay();
    await user.click(hero().getByRole('button', { name: /geef me vuur/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('TERUG NAAR ROOM closes the reveal', async () => {
    const user = userEvent.setup();
    renderOverlay();
    await user.click(hero().getByRole('button', { name: /geef mij een missie/i }));
    await user.click(screen.getByRole('button', { name: /terug naar room/i }));
    expect(screen.queryByTestId('hunt-reveal')).not.toBeInTheDocument();
    expect(hero().getByRole('button', { name: /geef mij een missie/i })).toHaveFocus();
  });

  it('PAK FTE-BON (hero) and PAK JE FTE-BON (below the fold) hand off to the FTE Bon Calculator', async () => {
    const user = userEvent.setup();
    const { onPakFteBon } = renderOverlay();
    await user.click(hero().getByRole('button', { name: /^pak fte-bon/i }));
    await user.click(screen.getByRole('button', { name: /pak je fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(2);
  });

  it('EXIT HUNT MODE and Escape close Hunt Mode; focus starts on Exit and stays inside', async () => {
    const user = userEvent.setup();
    const { onExit } = renderOverlay();
    const exit = screen.getByRole('button', { name: /exit hunt mode/i });
    expect(exit).toHaveFocus();
    await user.tab();
    expect(hero().getByRole('button', { name: /geef mij een missie/i })).toHaveFocus();
    exit.focus();
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: /pak je fte-bon/i })).toHaveFocus();
    await user.click(exit);
    expect(onExit).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it('the War Room is still one click away and Escape closes only the War Room', async () => {
    const user = userEvent.setup();
    const { onExit } = renderOverlay();
    await user.click(screen.getByRole('button', { name: /open war room/i }));
    expect(screen.getByTestId('war-room-line')).toHaveTextContent('TARGET ACQUIRED: UTRECHT');
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('war-room')).not.toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('missing cinematic files: no <video>, the SVG fallback scene renders', async () => {
    renderOverlay();
    // The availability check runs once per session (it may already be cached).
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    const backdrop = screen.getByTestId('hunt-backdrop');
    expect(backdrop.querySelector('video')).toBeNull();
    expect(backdrop.querySelectorAll('img')).toHaveLength(4);
  });

  it('with reduced motion: never a video, hero shows without the activation delay, everything works', async () => {
    mockMotion(true);
    const user = userEvent.setup();
    const { onPakFteBon } = renderOverlay({ fromActivation: true });
    expect(screen.getByTestId('hunt-backdrop').querySelector('video')).toBeNull();
    expect(hero().getByRole('heading', { name: /the net fte hunt is on/i }).style.animationDelay).toBe('100ms');
    await user.click(hero().getByRole('button', { name: /^pak fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalled();
  });

  it('after a deliberate activation the hero waits for the MISSION ACTIVATED stamp', () => {
    renderOverlay({ fromActivation: true });
    expect(hero().getByRole('heading', { name: /the net fte hunt is on/i }).style.animationDelay).toBe('1100ms');
  });

  it('locks the page scroll while open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<HuntModeOverlay fromActivation={false} onExit={vi.fn()} onPakFteBon={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
