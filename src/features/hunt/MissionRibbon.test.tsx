import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionRibbon } from './MissionRibbon';

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

/** The readable (not aria-hidden) text of the ticker: one pass of the items. */
function readableTicker(): string {
  const track = screen.getByTestId('mission-ribbon-track');
  const clone = track.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return clone.textContent ?? '';
}

describe('MissionRibbon — live intel ticker', () => {
  beforeEach(() => {
    mockMotion(false);
    fetchFteBonnen.mockReset();
    fetchFteBonnen.mockResolvedValue([]);
  });

  it('has a fixed NET FTE HUNT label, the ticker in the middle and a fixed PAK FTE-BON on the right', async () => {
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    const ribbon = screen.getByTestId('mission-ribbon');
    const track = screen.getByTestId('mission-ribbon-track');
    expect(within(ribbon).getByText('Net FTE Hunt')).toBeInTheDocument();
    expect(track).not.toContainElement(within(ribbon).getByText('Net FTE Hunt'));
    expect(track).not.toContainElement(within(ribbon).getByRole('button', { name: /pak fte-bon/i }));
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('runs the live items in order: VCDB, Net FTE, next target, FTE needed, factor, motto', async () => {
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    const text = readableTicker();
    const order = ['VCDB #1', 'Net FTE #10', 'Next target #9 Utrecht', '+0,19 FTE nodig', 'Factor 1,3x', 'BPT + VD. Dat is de opdracht.'].map((part) => text.indexOf(part));
    order.forEach((index) => expect(index).toBeGreaterThanOrEqual(0));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('is a seamless loop: the track animates and holds two identical halves, the second hidden from screen readers', async () => {
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    const track = screen.getByTestId('mission-ribbon-track');
    expect(track.className).toContain('animate-intel-ticker');
    expect(track.className).toContain('group-hover/ribbon:[animation-play-state:paused]');
    const [first, second] = Array.from(track.children);
    expect(track.children).toHaveLength(2);
    expect(first.textContent).toBe(second.textContent);
    expect(second).toHaveAttribute('aria-hidden', 'true');
    // Only one pass of the items is readable.
    expect(readableTicker().match(/VCDB/g)).toHaveLength(1);
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('with reduced motion stands still: no animation, no duplicate half', async () => {
    mockMotion(true);
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    const track = screen.getByTestId('mission-ribbon-track');
    expect(track.className).not.toContain('animate-intel-ticker');
    expect(track.children).toHaveLength(1);
    expect(readableTicker()).toContain('Next target #9 Utrecht');
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('counts open FTE-bonnen toward the next target', async () => {
    fetchFteBonnen.mockResolvedValue([OPEN_BON]);
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    await waitFor(() => expect(readableTicker()).toContain('Next target #8 Leeuwarden'));
    expect(readableTicker()).toContain('+2,39 FTE nodig');
  });

  it('once Zwolle is #1 in Net FTE there is no next target', async () => {
    fetchFteBonnen.mockResolvedValue([{ ...OPEN_BON, fteDelta: 20 }]);
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    await waitFor(() => expect(readableTicker()).toContain('#1 — vasthouden'));
    expect(readableTicker()).not.toContain('Next target');
  });

  it('PAK FTE-BON calls through to the calculator', async () => {
    fetchFteBonnen.mockResolvedValue(null);
    const user = userEvent.setup();
    const onPakFteBon = vi.fn();
    render(<MissionRibbon onPakFteBon={onPakFteBon} />);
    await user.click(screen.getByRole('button', { name: /pak fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(1);
  });
});
