import { RefreshCw } from 'lucide-react';
import type { ProductionDataQuality } from '../../services/productionAggregate';

function formatSyncTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Always rendered in Europe/Amsterdam — the team's own timezone, not the
 * viewer's — so a snapshot time reads the same for everyone. A date-only
 * snapshot (no reliable Power BI refresh time in the screenshot) renders
 * as just the date, never a fabricated time.
 */
function formatPowerBiTime(isoDateOrDateOnly: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateOrDateOnly);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day} ${MONTH_ABBR[Number(month) - 1]} ${year}`;
  }
  const date = new Date(isoDateOrDateOnly);
  if (Number.isNaN(date.getTime())) return '—';
  const zone = 'Europe/Amsterdam';
  const day = date.toLocaleString('en-GB', { day: '2-digit', timeZone: zone });
  const month = date.toLocaleString('en-GB', { month: 'short', timeZone: zone }).slice(0, 3).toUpperCase();
  const year = date.toLocaleString('en-GB', { year: 'numeric', timeZone: zone });
  const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone });
  return `${day} ${month} ${year} · ${time}`;
}

interface IntelligenceStatusSectionProps {
  fetchedAt: string;
  degraded: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  powerBiUpdatedAt: string | null;
  dataQuality: ProductionDataQuality;
}

/**
 * Technical data-source status, consolidated into one compact block at
 * the very bottom of Mission Control — never scattered between the
 * mission-critical content above it. Marre's sync status and refresh
 * control (unchanged behaviour from useProductionFeed.ts), the Power BI
 * manual snapshot's own last-refresh time, and the current data-quality
 * counts (services/productionAggregate.ts, unchanged).
 */
export function IntelligenceStatusSection({ fetchedAt, degraded, refreshing, onRefresh, powerBiUpdatedAt, dataQuality }: IntelligenceStatusSectionProps) {
  return (
    <div className="panel p-4 sm:p-5">
      <p className="label-classified text-gold/70">Intelligence Status</p>
      <div className="mt-3 grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-3">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Marre Production Feed</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {degraded ? 'Last Successful Sync' : 'Last Sync'} · {formatSyncTime(fetchedAt)}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold hover:text-gold-bright disabled:opacity-50"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} aria-hidden />
            {refreshing ? 'Syncing…' : 'Refresh Data'}
          </button>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Power BI Intelligence</p>
          <p className="mt-1 text-sm font-semibold text-ink">{powerBiUpdatedAt ? formatPowerBiTime(powerBiUpdatedAt) : 'Awaiting Update'}</p>
          {powerBiUpdatedAt && <p className="mt-1 text-[11px] text-ink-muted">Manual Snapshot</p>}
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Data Quality</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {dataQuality.scoringPendingCount} Pending
            {dataQuality.scoringMismatchCount > 0 && ` · ${dataQuality.scoringMismatchCount} Mismatch`}
          </p>
        </div>
      </div>
    </div>
  );
}
