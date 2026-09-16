import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeagueCheckIntelligenceStrip } from './LeagueCheckIntelligenceStrip';
import type { LeagueCheckReceiptStats } from '../../services/leagueCheckReceipts';

const { fetchLeagueCheckReceiptStats } = vi.hoisted(() => ({ fetchLeagueCheckReceiptStats: vi.fn() }));

vi.mock('../../services/leagueCheckReceipts', () => ({ fetchLeagueCheckReceiptStats }));

describe('LeagueCheckIntelligenceStrip — compact quality indicator, never a league score', () => {
  it('renders nothing when the data source is unavailable (unconfigured or a fetch error)', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue(null);
    const { container } = render(<LeagueCheckIntelligenceStrip />);
    await waitFor(() => expect(container.textContent).toBe(''));
  });

  it('empty state: 0 receipts, 0/0 checks, 0% checked, no division-by-zero text like NaN or Infinity', async () => {
    const stats: LeagueCheckReceiptStats = {
      totalReceipts: 0,
      completedChecks: 0,
      maxChecks: 0,
      approvedCount: 0,
      openCount: 0,
      openChecks: 0,
      completionPercentage: 0,
    };
    fetchLeagueCheckReceiptStats.mockResolvedValue(stats);
    render(<LeagueCheckIntelligenceStrip />);

    // Receipts, Approved and Open all render "00" — three occurrences.
    expect(await screen.findAllByText('00')).toHaveLength(3);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    expect(screen.getByText('0% checked')).toBeInTheDocument();
    expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/infinity/i)).not.toBeInTheDocument();
  });

  it('renders the worked example figures: 09 receipts, 47/54 checks, 06 approved, 03 open, 87% checked', async () => {
    const stats: LeagueCheckReceiptStats = {
      totalReceipts: 9,
      completedChecks: 47,
      maxChecks: 54,
      approvedCount: 6,
      openCount: 3,
      openChecks: 7,
      completionPercentage: 87,
    };
    fetchLeagueCheckReceiptStats.mockResolvedValue(stats);
    render(<LeagueCheckIntelligenceStrip />);

    expect(await screen.findByText('09')).toBeInTheDocument();
    expect(screen.getByText('47 / 54')).toBeInTheDocument();
    expect(screen.getByText('87% checked')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('7 open checks')).toBeInTheDocument();
  });

  it('uses the word CHECKS, never POINTS, to avoid confusion with VCDB/Final Score', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue({
      totalReceipts: 1,
      completedChecks: 6,
      maxChecks: 6,
      approvedCount: 1,
      openCount: 0,
      openChecks: 0,
      completionPercentage: 100,
    });
    render(<LeagueCheckIntelligenceStrip />);

    await screen.findByText('6 / 6');
    expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
  });
});
