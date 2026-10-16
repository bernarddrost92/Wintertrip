import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HUNT_INTRO_MS, HuntModeOverlay } from './HuntModeOverlay';
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

function renderOverlay(props: Partial<Parameters<typeof HuntModeOverlay>[0]> = {}) {
  const onExit = vi.fn();
  const onPakFteBon = vi.fn();
  render(<HuntModeOverlay showIntro={false} onExit={onExit} onPakFteBon={onPakFteBon} {...props} />);
  return { onExit, onPakFteBon };
}

describe('HuntModeOverlay', () => {
  beforeEach(() => {
    fetchFteBonnen.mockReset();
    fetchFteBonnen.mockResolvedValue([]);
  });

  it('is a modal dialog with live data: VCDB #1, Net FTE #10, next target #9 Utrecht +0,19 FTE', async () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog', { name: /the fte hunt is on/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(within(dialog).getByLabelText('A · Onze kracht')).getByText('#1')).toBeInTheDocument();
    expect(within(within(dialog).getByLabelText('B · De missie')).getByText('#10')).toBeInTheDocument();
    const target = screen.getByTestId('hunt-next-target');
    expect(target).toHaveTextContent('#9 Utrecht');
    expect(target).toHaveTextContent('+0,19 FTE nodig');
    expect(screen.getByText('Net FTE = BPT + VD')).toBeInTheDocument();
    expect(screen.getByText('PO telt niet mee.')).toBeInTheDocument();
    for (const move of ['Verlengen', 'PO → contract', 'Nieuwe contractant', 'Uren ophogen']) expect(screen.getByText(move)).toBeInTheDocument();
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('uses the open FTE-bonnen for the projection and the next target', async () => {
    fetchFteBonnen.mockResolvedValue([{ id: 'a', label: 'JdV', type: 'VERLENGING', fteDelta: 0.5, owner: 'TM', note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z' }]);
    renderOverlay();
    await waitFor(() => expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('#8 Leeuwarden'));
    expect(screen.getByTestId('hunt-next-target')).toHaveTextContent('+2,39 FTE nodig');
    expect(screen.getByText('1 open')).toBeInTheDocument();
  });

  it('shows the mission intro first, which can be skipped', async () => {
    const user = userEvent.setup();
    renderOverlay({ showIntro: true });
    expect(screen.getByText(/team zwolle \/\/ classified/i)).toBeInTheDocument();
    expect(screen.getByText(/hunt is on/i)).toBeInTheDocument();
    expect(screen.getByText('VCDB #1')).toBeInTheDocument();
    expect(screen.getByText('Net FTE #10')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /intro overslaan/i }));
    expect(screen.getByRole('heading', { name: /the fte hunt is on/i })).toBeInTheDocument();
  });

  it('the intro opens the Hunt Room by itself after a short beat', () => {
    vi.useFakeTimers();
    try {
      renderOverlay({ showIntro: true });
      expect(screen.queryByTestId('hunt-next-target')).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(HUNT_INTRO_MS + 10));
      expect(screen.getByTestId('hunt-next-target')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('EXIT HUNT MODE and Escape both close it', async () => {
    const user = userEvent.setup();
    const { onExit } = renderOverlay();
    await user.click(screen.getByRole('button', { name: /exit hunt mode/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it('moves focus inside and keeps Tab inside the overlay', async () => {
    const user = userEvent.setup();
    renderOverlay();
    const exit = screen.getByRole('button', { name: /exit hunt mode/i });
    expect(exit).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: /pak je fte-bon/i })).toHaveFocus();
    await user.tab();
    expect(exit).toHaveFocus();
  });

  it('GEEF ME NOG ÉÉN shows a different one-liner each click', async () => {
    const user = userEvent.setup();
    renderOverlay();
    const line = screen.getByTestId('hunt-one-liner');
    const seen = [line.textContent];
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole('button', { name: /geef me nog één/i }));
      const next = screen.getByTestId('hunt-one-liner').textContent;
      expect(next).not.toBe(seen[seen.length - 1]);
      expect(HUNT_ONE_LINERS).toContain(next);
      seen.push(next);
    }
  });

  it('GEEF MIJ EEN MISSIE generates a valid sales mission', async () => {
    const user = userEvent.setup();
    renderOverlay();
    expect(screen.queryByTestId('hunt-mission')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /geef mij een missie/i }));
    const first = screen.getByTestId('hunt-mission').textContent;
    expect(HUNT_MISSIONS).toContain(first);
    await user.click(screen.getByRole('button', { name: /geef mij een missie/i }));
    expect(screen.getByTestId('hunt-mission').textContent).not.toBe(first);
  });

  it('PAK JE FTE-BON hands off to the FTE Bon Calculator', async () => {
    const user = userEvent.setup();
    const { onPakFteBon } = renderOverlay();
    await user.click(screen.getByRole('button', { name: /pak je fte-bon/i }));
    expect(onPakFteBon).toHaveBeenCalledTimes(1);
  });

  it('locks the page scroll while open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<HuntModeOverlay showIntro={false} onExit={vi.fn()} onPakFteBon={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
