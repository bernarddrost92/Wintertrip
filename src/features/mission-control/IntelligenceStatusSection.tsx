import { formatPowerBiTime } from '../../utils/snapshotTime';

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
