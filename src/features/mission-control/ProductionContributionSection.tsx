import { SectionHeader } from '../../components/SectionHeader';
import { formatVcdbValue } from '../../utils/format';
import type { AgentRole } from '../../types/league';
import type { AgentContribution } from '../../services/productionAggregate';

function AgentRow({ stats, position, role }: { stats: AgentContribution; position: number; role: AgentRole }) {
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
            {role}
          </span>
        </span>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg font-semibold tabular-nums text-gold sm:text-xl">{formatVcdbValue(stats.score)} points</p>
        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
          {stats.deals} {stats.deals === 1 ? 'deal' : 'deals'}
        </p>
      </div>
    </li>
  );
}

interface ContributionSectionProps {
  role: AgentRole;
  agents: AgentContribution[];
}

/**
 * AM CONTRIBUTION / TM CONTRIBUTION — attribution views over the same
 * unique deal set the Team Zwolle total is computed from (see
 * services/productionAggregate.ts), never additional deals. TM is
 * deliberately just the ranked list of AMs/TMs who actually have a
 * Talentmanager filled in — an empty TM never shows here as "Unknown"/
 * "Unassigned"/"Missing", it simply contributes no row.
 */
export function ProductionContributionSection({ role, agents }: ContributionSectionProps) {
  const title = role === 'AM' ? 'AM Contribution' : 'TM Contribution';
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Marre Production Feed" title={title} />
      {agents.length === 0 ? (
        <p className="mt-5 text-sm text-ink-muted">Nog geen scorende deals in de huidige feed.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {agents.map((stats, i) => (
            <AgentRow key={stats.code} stats={stats} position={i + 1} role={role} />
          ))}
        </ul>
      )}
    </div>
  );
}
