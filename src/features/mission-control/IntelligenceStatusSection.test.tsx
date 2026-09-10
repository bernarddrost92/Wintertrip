import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';

describe('IntelligenceStatusSection', () => {
  it('shows Marre feed sync + refresh, Power BI last refresh, and data quality in one compact block', () => {
    render(
      <IntelligenceStatusSection
        fetchedAt="2026-09-09T08:06:00.000Z"
        degraded={false}
        refreshing={false}
        onRefresh={vi.fn()}
        powerBiUpdatedAt="2026-09-09T05:07:00+02:00"
        dataQuality={{ scoringPendingCount: 2, scoringMismatchCount: 1 }}
      />,
    );
    expect(screen.getByText(/marre production feed/i)).toBeInTheDocument();
    expect(screen.getByText('09 SEP 2026 · 05:07')).toBeInTheDocument();
    expect(screen.getByText(/manual snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/2 pending · 1 mismatch/i)).toBeInTheDocument();
  });

  it('the Refresh Data button calls onRefresh', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(
      <IntelligenceStatusSection
        fetchedAt="2026-09-09T08:06:00.000Z"
        degraded={false}
        refreshing={false}
        onRefresh={onRefresh}
        powerBiUpdatedAt={null}
        dataQuality={{ scoringPendingCount: 0, scoringMismatchCount: 0 }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /refresh data/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('a date-only snapshot (no reliable refresh time) renders just the date, never a fabricated time', () => {
    render(
      <IntelligenceStatusSection
        fetchedAt="2026-09-10T08:06:00.000Z"
        degraded={false}
        refreshing={false}
        onRefresh={vi.fn()}
        powerBiUpdatedAt="2026-09-10"
        dataQuality={{ scoringPendingCount: 0, scoringMismatchCount: 0 }}
      />,
    );
    expect(screen.getByText('10 SEP 2026')).toBeInTheDocument();
    expect(screen.queryByText(/10 sep 2026 ·/i)).not.toBeInTheDocument();
  });

  it('no Power BI timestamp -> Awaiting Update', () => {
    render(
      <IntelligenceStatusSection
        fetchedAt="2026-09-09T08:06:00.000Z"
        degraded={false}
        refreshing={false}
        onRefresh={vi.fn()}
        powerBiUpdatedAt={null}
        dataQuality={{ scoringPendingCount: 0, scoringMismatchCount: 0 }}
      />,
    );
    expect(screen.getByText(/awaiting update/i)).toBeInTheDocument();
  });

  it('no mismatch -> only the pending count is shown', () => {
    render(
      <IntelligenceStatusSection
        fetchedAt="2026-09-09T08:06:00.000Z"
        degraded={false}
        refreshing={false}
        onRefresh={vi.fn()}
        powerBiUpdatedAt={null}
        dataQuality={{ scoringPendingCount: 2, scoringMismatchCount: 0 }}
      />,
    );
    expect(screen.getByText('2 Pending')).toBeInTheDocument();
  });
});
