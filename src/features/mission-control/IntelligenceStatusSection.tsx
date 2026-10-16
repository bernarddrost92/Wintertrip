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
    <p className="px-1 text-[13px] text-ink-muted">
      Power BI: <span className="font-semibold text-ink">{powerBiUpdatedAt ? formatPowerBiTime(powerBiUpdatedAt) : 'Awaiting Update'}</span>
      {powerBiUpdatedAt && <span> · Manual Snapshot</span>}
    </p>
  );
}
