import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissionRibbon } from './MissionRibbon';
import { HUNT_ONE_LINERS } from './huntLines';

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

describe('MissionRibbon', () => {
  it('shows the live hunt numbers from the current standings', async () => {
    fetchFteBonnen.mockResolvedValue([]);
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    const ribbon = screen.getByTestId('mission-ribbon');
    expect(ribbon).toHaveTextContent('VCDB #1');
    expect(ribbon).toHaveTextContent('Net FTE #10');
    expect(ribbon).toHaveTextContent('Next target #9 Utrecht');
    expect(ribbon).toHaveTextContent('+0,19 FTE nodig');
    expect(HUNT_ONE_LINERS.some((line) => ribbon.textContent?.includes(line))).toBe(true);
    await waitFor(() => expect(fetchFteBonnen).toHaveBeenCalled());
  });

  it('counts open FTE-bonnen toward the next target', async () => {
    fetchFteBonnen.mockResolvedValue([{ id: 'a', label: 'JdV', type: 'VERLENGING', fteDelta: 0.5, owner: 'TM', note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z' }]);
    render(<MissionRibbon onPakFteBon={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('mission-ribbon')).toHaveTextContent('Next target #8 Leeuwarden'));
    expect(screen.getByTestId('mission-ribbon')).toHaveTextContent('+2,39 FTE nodig');
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
