import type { AgentSummary } from '../../services/missionHuntAggregate';

interface AgentSummaryCardProps {
  summary: AgentSummary;
  onClick: () => void;
}

/**
 * Team Dashboard's only per-person unit — a summary, never a project list.
 * Clicking is the one and only way to see that person's actual projects
 * (spec section 21/22): the main screen must never get "polluted" with
 * project names.
 */
export function AgentSummaryCard({ summary, onClick }: AgentSummaryCardProps) {
  const { profile, counts, reviewPercent, isComplete } = summary;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 border border-white/10 bg-mission-raised p-4 text-left transition-colors duration-150 hover:border-gold/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-ink">{profile.displayName}</p>
        <span
          className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${
            isComplete ? 'border-status-go/50 bg-status-go/10 text-status-go' : 'border-white/15 text-ink-muted'
          }`}
        >
          {isComplete ? 'COMPLETE' : `${reviewPercent}%`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
        <span className="text-ink">{counts.total} PROJECTS</span>
        <span className="text-status-go">{counts.opportunity} KANS</span>
        <span className="text-gold">{counts.investigate} UITZOEKEN</span>
        <span>{counts.unreviewed} OPEN</span>
      </div>

      <div className="h-1 w-full bg-white/10">
        <div className="h-full bg-gold-sweep transition-all duration-500" style={{ width: `${reviewPercent}%` }} />
      </div>
    </button>
  );
}
