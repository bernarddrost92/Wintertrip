import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeagueCheckReceiptsSection } from './LeagueCheckReceiptsSection';
import type { LeagueCheckReceiptStats } from '../../services/leagueCheckReceipts';

const { fetchLeagueCheckReceiptStats } = vi.hoisted(() => ({ fetchLeagueCheckReceiptStats: vi.fn() }));

vi.mock('../../services/leagueCheckReceipts', () => ({ fetchLeagueCheckReceiptStats }));

function stats(overrides: Partial<LeagueCheckReceiptStats> = {}): LeagueCheckReceiptStats {
  return {
    totalReceipts: 0,
    completedChecks: 0,
    maxChecks: 0,
    approvedCount: 0,
    openCount: 0,
    openChecks: 0,
    completionPercentage: 0,
    totalFoundPoints: 0,
    totalMissionValue: 0,
    ...overrides,
  };
}

describe('LeagueCheckReceiptsSection', () => {
  it('shows the receipt count with total found points and total mission value', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue(
      stats({ totalReceipts: 7, approvedCount: 4, openCount: 3, totalFoundPoints: 152.5, totalMissionValue: 4210.75 }),
    );
    render(<LeagueCheckReceiptsSection />);

    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(screen.getByText('4 Approved · 3 Open')).toBeInTheDocument();
    expect(screen.getByText('+152,50')).toBeInTheDocument();
    expect(screen.getByText('4.210,75')).toBeInTheDocument();
  });

  it('negative found points keep their sign', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue(stats({ totalReceipts: 1, openCount: 1, totalFoundPoints: -40 }));
    render(<LeagueCheckReceiptsSection />);

    expect(await screen.findByText('−40,00')).toBeInTheDocument();
  });

  it('totals unavailable (Supabase unreachable) -> a clear unavailable line, never fabricated zeros', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue(null);
    render(<LeagueCheckReceiptsSection />);

    expect(await screen.findByText(/receipt totals unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText('+0,00')).not.toBeInTheDocument();
  });

  it('explains that older receipts count without points', async () => {
    fetchLeagueCheckReceiptStats.mockResolvedValue(stats());
    render(<LeagueCheckReceiptsSection />);

    expect(await screen.findByText(/oudere receipts/i)).toBeInTheDocument();
  });
});
