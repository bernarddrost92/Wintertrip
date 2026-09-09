import { useState } from 'react';
import { SectionHeader } from '../../components/SectionHeader';
import { formatVcdbValue } from '../../utils/format';
import type { AgentContribution } from '../../services/productionAggregate';

function AgentRow({ stats, position }: { stats: AgentContribution; position: number }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 last:border-b-0">
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
            position === 1 ? 'border-gold bg-gold/10 text-gold' : 'border-white/15 text-ink-muted'
          }`}
        >
          {position}
        </span>
        <span className="truncate text-sm font-medium text-ink">{stats.code}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="font-display text-sm font-semibold tabular-nums text-gold">{formatVcdbValue(stats.score)}</span>
        <span className="ml-1.5 text-[10px] text-ink-muted">
          ({stats.deals} {stats.deals === 1 ? 'deal' : 'deals'})
        </span>
      </span>
    </li>
  );
}

function ContributionColumn({ title, agents }: { title: string; agents: AgentContribution[] }) {
  const [expanded, setExpanded] = useState(false);
  const top = agents.slice(0, 3);
  const rest = agents.slice(3);

  return (
    <div>
      <p className="label-classified text-gold/70">{title}</p>
      {agents.length === 0 ? (
        <p className="mt-3 text-xs text-ink-muted">Nog geen scorende deals in de huidige feed.</p>
      ) : (
        <>
          <ul className="mt-2">
            {top.map((stats, i) => (
              <AgentRow key={stats.code} stats={stats} position={i + 1} />
            ))}
            {expanded && rest.map((stats, i) => <AgentRow key={stats.code} stats={stats} position={i + 4} />)}
          </ul>
          {rest.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gold/70 hover:text-gold"
            >
              {expanded ? 'Show Less' : `View All (${agents.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * AM + TM Contribution combined into one compact section — side by side on
 * desktop, stacked on mobile. Top 3 per column are always visible; the
 * rest collapse behind View All. Both columns read the same unique
 * scored-deal set as the Base League Points total (services/
 * productionAggregate.ts, unchanged): a 100-point deal attributes +100 to
 * its AM AND +100 to its TM without ever doubling the team total, and an
 * empty TM simply contributes no TM row — never "Unknown"/"Missing".
 */
export function TeamContributionSection({ am, tm }: { am: AgentContribution[]; tm: AgentContribution[] }) {
  return (
    <div className="panel p-4 sm:p-5">
      <SectionHeader eyebrow="Marre Production Feed" title="Team Contribution" />
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <ContributionColumn title="Account Management" agents={am} />
        <ContributionColumn title="Talent Management" agents={tm} />
      </div>
    </div>
  );
}
