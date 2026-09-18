import type { AccountManagerSummary } from '../../services/missionHuntAggregate';
import { buildOpportunityReviewProgress } from '../../services/missionHuntOpportunityReview';
import type { OpportunityReview } from '../../types/missionHunt';

interface AccountManagerSummaryCardProps {
  summary: AccountManagerSummary;
  onClick: () => void;
  /** Omitted by any caller that doesn't have reviews loaded — the review
   * intelligence line simply doesn't render then. */
  opportunityReviews?: OpportunityReview[];
}

/**
 * Friday Review's only per-person unit — a summary, never a placement
 * list. Clicking is the one and only way to see that person's actual
 * placements: the main screen never gets "polluted" with professional/
 * client names.
 */
export function AccountManagerSummaryCard({ summary, onClick, opportunityReviews }: AccountManagerSummaryCardProps) {
  const { displayName, counts, isVerified, hasLoggedIn } = summary;
  const progress = opportunityReviews ? buildOpportunityReviewProgress(summary.placements, opportunityReviews) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 border border-white/10 bg-mission-raised p-4 text-left transition-colors duration-150 hover:border-gold/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-ink">{displayName}</p>
        <span
          className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${
            isVerified ? 'border-status-go/50 bg-status-go/10 text-status-go' : 'border-white/15 text-ink-muted'
          }`}
        >
          {isVerified ? '✅ GECONTROLEERD' : '⚠ NOG CONTROLEREN'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted">
        <span className="text-ink">{counts.total} plaatsingen</span>
        <span className="text-gold">{counts.verleng} verlengkansen</span>
        <span className="text-status-go">{counts.timing} timingkansen</span>
        <span className="text-sky-400">{counts.urenkans} urenkansen</span>
        {counts.double > 0 && <span className="text-red-400">{counts.double} double</span>}
      </div>

      {progress && progress.opportunityTotal > 0 && (
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
          {progress.reviewedCount}/{progress.opportunityTotal} beoordeeld
          {progress.opvolgen > 0 && <span className="text-gold"> · {progress.opvolgen} opvolgen</span>}
        </p>
      )}

      {!hasLoggedIn && <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted/70">○ nog niet ingelogd</p>}
    </button>
  );
}
