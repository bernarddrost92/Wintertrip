import { AlertTriangle } from 'lucide-react';
import { MissionMetric } from '../../components/MissionMetric';
import { formatDb, formatFactor } from '../../utils/format';
import type { ProductionSourceMeta, TeamProductionStats } from '../../types/production';

interface ProductionHeroSectionProps {
  team: TeamProductionStats;
  sourceMeta: ProductionSourceMeta;
}

/**
 * Mission Control's production identity block — placements and DB "in one
 * glance", per spec, with the data source status impossible to miss: this
 * is a manual Excel snapshot, never presented as a live SharePoint sync.
 */
export function ProductionHeroSection({ team, sourceMeta }: ProductionHeroSectionProps) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="text-center sm:text-left">
        <p className="label-classified text-gold/70">007 · Mission Control</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
          Operatie Wintertrip 2027
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.4em] text-gold/80">Team Zwolle</p>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 border border-gold/20 bg-mission-panel px-4 py-2 sm:justify-start">
        <span className="label-classified">Official Live Factor</span>
        <span className="font-display text-lg font-bold text-gold">{formatFactor(1)}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="panel px-5 py-5">
          <MissionMetric label="Placements" value={`${team.placementCount}`} size="xl" tone="gold" />
        </div>
        <div className="panel px-5 py-5">
          <MissionMetric label="DB" value={formatDb(team.knownDb)} size="xl" />
        </div>
      </div>

      {team.missingDbCount > 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold/80 sm:justify-start">
          <AlertTriangle size={13} className="shrink-0 text-gold" aria-hidden />
          {team.missingDbCount} {team.missingDbCount === 1 ? 'plaatsing' : 'plaatsingen'} zonder DB
        </p>
      )}

      <div className="mt-6 grid gap-px border border-gold/15 bg-gold/10 sm:grid-cols-3">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Data Source</p>
          <p className="mt-1 text-sm font-semibold text-ink">{sourceMeta.dataSourceLabel}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Sync Mode</p>
          <p className="mt-1 text-sm font-semibold text-gold">{sourceMeta.syncMode === 'MANUAL_SNAPSHOT' ? 'Manual Snapshot' : 'Live Synced'}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">{sourceMeta.syncLabel}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{sourceMeta.syncValue}</p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-ink-muted sm:text-left">
        Team Zwolle League Points <span className="text-gold">· Scoring Pending</span> — {team.placementCount}/{team.placementCount} records
      </p>
    </div>
  );
}
