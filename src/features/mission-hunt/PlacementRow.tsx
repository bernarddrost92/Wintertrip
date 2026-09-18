import { calculatedWeeklyHours, classifyPlacement } from '../../services/missionHuntClassification';
import { badgesForClassification } from '../../services/missionHuntOpportunity';
import { hasOpportunitySignal } from '../../services/missionHuntOpportunityReview';
import { OpportunityReviewControl } from './OpportunityReviewControl';
import { formatIsoDateNl } from '../../utils/dates';
import type { MissionHuntPlacement, OpportunityReview, OpportunityReviewActionType, OpportunityReviewStatus } from '../../types/missionHunt';

interface PlacementRowProps {
  placement: MissionHuntPlacement;
  onOpen: () => void;
  /** Only passed by MyPlacementsView (the AM's own sales-meeting review) —
   * every other caller (Friday Review drawers, My Professionals) omits
   * both and gets the exact read-only row it always had. */
  review?: OpportunityReview | null;
  onReview?: (status: OpportunityReviewStatus, actionType: OpportunityReviewActionType | null, note: string | null) => Promise<void> | void;
}

/**
 * One line per placement, built to scan 20-30 of these in a few seconds.
 * Professional is the bold title (per the spec's own display example),
 * Klant/DB/uren/dates below, opportunity badges — fully automatic, nobody
 * picks these — on the right. The top block opens the detail view; the
 * optional review control below it is a separate control, never nested
 * inside that button.
 */
export function PlacementRow({ placement, onOpen, review = null, onReview }: PlacementRowProps) {
  const classification = classifyPlacement(placement.startDate, placement.endDate, placement.hoursPerWeek);
  const badges = badgesForClassification(classification);
  const weeklyHours = calculatedWeeklyHours(placement.hoursPerWeek);
  const showReview = Boolean(onReview) && hasOpportunitySignal(classification);
  const metaParts = [
    placement.clientName,
    placement.monthlyDb !== null ? `${placement.monthlyDb} DB` : null,
    placement.hoursPerWeek !== null ? `${placement.hoursPerWeek} uur` : null,
  ].filter(Boolean);

  return (
    <div className="border-b border-white/8 py-3 last:border-b-0">
      <button type="button" onClick={onOpen} className="flex w-full flex-col gap-1.5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-wide text-ink">{placement.professionalName || '—'}</p>
            <p className="truncate text-xs text-ink-muted">{metaParts.join(' · ')}</p>
            {placement.startDate && placement.endDate && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted/80">
                {formatIsoDateNl(placement.startDate)} → {formatIsoDateNl(placement.endDate)}
              </p>
            )}
          </div>
        </div>
        {classification.isUrenkans && placement.hoursPerWeek !== null && (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-sky-400">
            {placement.hoursPerWeek} FTE · {weeklyHours} UUR
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map((badge) => {
              // A checkmark replaces the icon once reviewed — the label itself
              // (and every other badge) never disappears. GEEN DIRECTE
              // GAME-KANS is not itself an opportunity signal, so it never
              // gets checked off, even alongside a reviewed URENKANS badge.
              const icon = review && badge.label !== 'GEEN DIRECTE GAME-KANS' ? '✓' : badge.icon;
              return (
                <span key={badge.label} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  <span aria-hidden>{icon}</span>
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}
      </button>
      {showReview && onReview && <OpportunityReviewControl review={review} onSave={onReview} />}
    </div>
  );
}
