import { SectionHeader } from '../../components/SectionHeader';
import { formatDb } from '../../utils/format';
import type { AgentRole } from '../../types/league';
import type { AgentProductionStats, UnassignedProductionStats } from '../../types/production';

function AgentRow({ stats, position }: { stats: AgentProductionStats; position: number }) {
  const hasKnownDb = stats.knownDb > 0;
  return (
    <li className="panel-inset flex items-center gap-4 px-4 py-3 sm:px-5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold ${
          position === 1 ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-ink-muted'
        }`}
      >
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-gold/60">Agent</span>
        <span className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium text-ink sm:text-base">{stats.code}</span>
          <span className="shrink-0 border border-gold/30 px-1 py-px text-[10px] font-semibold uppercase tracking-wider text-gold/80">
            {stats.role}
          </span>
        </span>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-display text-lg font-semibold tabular-nums sm:text-xl ${hasKnownDb ? 'text-gold' : 'text-ink-muted'}`}>
          {hasKnownDb ? `${formatDb(stats.knownDb)} DB` : 'DB Pending'}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
          {stats.placementCount} {stats.placementCount === 1 ? 'placement' : 'placements'}
          {stats.missingDbCount > 0 && hasKnownDb && (
            <span className="text-gold/70"> · {stats.missingDbCount} DB pending</span>
          )}
        </p>
      </div>
    </li>
  );
}

function UnassignedNotice({ unassigned }: { unassigned: UnassignedProductionStats }) {
  if (unassigned.placementCount === 0) return null;
  return (
    <div className="mt-3 border border-gold/30 bg-gold/5 px-4 py-3 sm:px-5">
      <p className="label-classified text-gold">TM Unassigned</p>
      <p className="mt-1 flex items-baseline gap-3 font-mono text-sm text-ink">
        <span className="font-semibold">{unassigned.placementCount} placements</span>
        <span className="text-ink-muted">·</span>
        <span className="font-semibold">{formatDb(unassigned.knownDb)} DB</span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">Nog geen Talentmanager ingevuld in Marre's snapshot.</p>
    </div>
  );
}

interface ContributionSectionProps {
  role: AgentRole;
  agents: AgentProductionStats[];
  unassigned?: UnassignedProductionStats;
}

/** AM CONTRIBUTION and TM CONTRIBUTION — production-based rankings (DB and
 * placement counts from Marre's snapshot), kept visually and structurally
 * separate from the League-score AM/TM leaderboards further down the page. */
export function ProductionContributionSection({ role, agents, unassigned }: ContributionSectionProps) {
  const title = role === 'AM' ? 'AM Contribution' : 'TM Contribution';
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Productie · huidige snapshot" title={title} />
      <ul className="mt-5 space-y-2">
        {agents.map((stats, i) => (
          <AgentRow key={stats.code} stats={stats} position={i + 1} />
        ))}
      </ul>
      {unassigned && <UnassignedNotice unassigned={unassigned} />}
    </div>
  );
}
