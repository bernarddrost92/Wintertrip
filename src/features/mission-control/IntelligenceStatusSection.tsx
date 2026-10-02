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
  powerBiUpdatedAt: string | null;
}

/**
 * Technical data-source status, one compact block at the very bottom of
 * Mission Control — never scattered between the mission-critical content
 * above it. Only the Power BI manual snapshot's own last-refresh time is
 * left: Marre's production feed (its sync status, refresh control and
 * data-quality counts) is no longer maintained and has been removed.
 */
export function IntelligenceStatusSection({ powerBiUpdatedAt }: IntelligenceStatusSectionProps) {
  return (
    <div className="panel p-4 sm:p-5">
      <p className="label-classified text-gold/70">Intelligence Status</p>
      <div className="mt-3 border border-white/10 bg-white/5">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Power BI Intelligence</p>
          <p className="mt-1 text-sm font-semibold text-ink">{powerBiUpdatedAt ? formatPowerBiTime(powerBiUpdatedAt) : 'Awaiting Update'}</p>
          {powerBiUpdatedAt && <p className="mt-1 text-[11px] text-ink-muted">Manual Snapshot</p>}
        </div>
      </div>
    </div>
  );
}
