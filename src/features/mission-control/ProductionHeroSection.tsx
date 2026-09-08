import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { MissionMetric } from '../../components/MissionMetric';
import { formatVcdbValue } from '../../utils/format';
import type { TeamProductionTotal } from '../../services/productionAggregate';

interface ProductionHeroSectionProps {
  team: TeamProductionTotal;
  mock: boolean;
  degraded: boolean;
  fetchedAt: string;
  refreshing: boolean;
  onRefresh: () => void;
}

function formatSyncTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Mission Control's production identity block — Total Base League Points
 * in one glance, always computed by the same central scoring engine as the
 * Calculator (never the Sheet's own League score column taken blindly —
 * see services/productionScoring.ts). The data-source/sync status is
 * impossible to miss: mock data is never presented as real Zwolle
 * production, and a connection failure never zeroes the score out.
 */
export function ProductionHeroSection({ team, mock, degraded, fetchedAt, refreshing, onRefresh }: ProductionHeroSectionProps) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="text-center sm:text-left">
        <p className="label-classified text-gold/70">007 · Mission Control</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Team Zwolle</h1>
      </div>

      <div className="mt-6 text-center sm:text-left">
        <p className="label-classified text-ink-muted">Total Base League Points</p>
        <p className="mt-1 font-display text-6xl font-bold tabular-nums text-gold drop-shadow-[0_0_28px_rgba(255,215,104,0.4)] sm:text-7xl">
          {formatVcdbValue(team.totalBaseLeaguePoints)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="panel px-5 py-5">
          <MissionMetric label="Qualifying Deals" value={`${team.qualifyingDeals}`} size="lg" tone="gold" />
        </div>
        <div className="panel px-5 py-5">
          <MissionMetric label="Scoring Pending" value={`${team.scoringPending}`} size="lg" tone={team.scoringPending > 0 ? 'default' : 'muted'} />
        </div>
      </div>

      {degraded && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold/80 sm:justify-start">
          <WifiOff size={13} className="shrink-0 text-gold" aria-hidden />
          Data Connection Degraded — laatste succesvolle sync getoond
        </p>
      )}

      {mock && (
        <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold/80 sm:justify-start">
          <AlertTriangle size={13} className="shrink-0 text-gold" aria-hidden />
          Mock Data — niet de actuele Zwolle productie
        </p>
      )}

      <div className="mt-6 grid gap-px border border-gold/15 bg-gold/10 sm:grid-cols-2">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">{degraded ? 'Last Successful Sync' : 'Last Sync'}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatSyncTime(fetchedAt)}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Data Source</p>
          <p className="mt-1 text-sm font-semibold text-ink">{mock ? 'Mock Data' : 'Marre Production Feed'}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-center sm:justify-start">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 border border-gold/40 bg-gold/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} aria-hidden />
          {refreshing ? 'Syncing…' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}
