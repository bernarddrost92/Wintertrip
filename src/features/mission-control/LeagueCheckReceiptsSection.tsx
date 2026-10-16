import { useEffect, useState } from 'react';
import { SectionHeader } from '../../components/SectionHeader';
import { fetchLeagueCheckReceiptStats, type LeagueCheckReceiptStats } from '../../services/leagueCheckReceipts';
import { formatFoundPoints, formatVcdbValue } from '../../utils/format';

type SectionStatus = 'loading' | 'unavailable' | 'ready';

/**
 * How many League Check receipts Team Zwolle generated, and the points they
 * add up to — replacing Team Contribution, which came from Marre's
 * no-longer-maintained production feed. Totals come straight from the
 * get_league_check_points_stats() RPC (services/leagueCheckReceipts.ts), the
 * single source of truth; this component never counts anything itself.
 * Points are what each receipt printed: receipts registered before points
 * were recorded, and standalone League Checks without a Calculator score,
 * count as receipts but add 0 points.
 */
export function LeagueCheckReceiptsSection() {
  const [status, setStatus] = useState<SectionStatus>('loading');
  const [stats, setStats] = useState<LeagueCheckReceiptStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeagueCheckReceiptStats().then((result) => {
      if (cancelled) return;
      setStats(result);
      setStatus(result ? 'ready' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="panel p-5 sm:p-7">
      <SectionHeader title="Mission Receipts" />

      {status === 'unavailable' ? (
        <p className="mt-4 text-sm text-ink-muted">De totalen zijn nu niet bereikbaar.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-3">
          <div className="bg-mission-panel px-4 py-3">
            <p className="stat-label">Bonnetjes</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">{stats ? stats.totalReceipts : '—'}</p>
            {stats && (
              <p className="mt-1 text-[13px] text-ink-muted">
                {stats.approvedCount} Approved · {stats.openCount} Open
              </p>
            )}
          </div>
          <div className="bg-mission-panel px-4 py-3">
            <p className="stat-label">Gevonden winst</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">
              {stats ? formatFoundPoints(stats.totalFoundPoints) : '—'}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">league-punten, alle bonnetjes</p>
          </div>
          <div className="bg-mission-panel px-4 py-3">
            <p className="stat-label">Mission Value</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
              {stats ? formatVcdbValue(stats.totalMissionValue) : '—'}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">league-punten, alle bonnetjes</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-[13px] text-ink-dim">Punten tellen vanaf 2 okt 2026; oudere receipts tellen mee zonder punten.</p>
    </div>
  );
}
