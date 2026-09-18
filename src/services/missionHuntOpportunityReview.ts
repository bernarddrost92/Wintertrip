import { classifyPlacement, type PlacementClassification } from './missionHuntClassification';
import type { MissionHuntPlacement, OpportunityReview, OpportunityReviewActionType, OpportunityReviewStatus } from '../types/missionHunt';

/**
 * Review state sits ON TOP of the automatic opportunity badges
 * (VERLENGKANS/TIMINGKANS/DOUBLE OPPORTUNITY/URENKANS) — it never replaces
 * or recomputes them. A placement needs sales-meeting review only if
 * Mission Hunt actually detected a real opportunity on it; GEEN DIRECTE
 * GAME-KANS alone (isGrey with no isUrenkans) is never counted, per spec.
 */
export function hasOpportunitySignal(classification: PlacementClassification): boolean {
  return classification.isTiming || classification.isExtension || classification.isUrenkans;
}

export const REVIEW_STATUS_LABEL: Record<OpportunityReviewStatus, string> = {
  opvolgen: 'OPVOLGEN',
  geen_kans: 'GEEN KANS',
  later: 'LATER',
};

export const REVIEW_STATUS_ICON: Record<OpportunityReviewStatus, string> = {
  opvolgen: '🎯',
  geen_kans: '✓',
  later: '→',
};

export const REVIEW_ACTION_TYPE_LABEL: Record<OpportunityReviewActionType, string> = {
  uren_ophogen: 'UREN OPHOGEN',
  verlenging_bespreken: 'VERLENGING BESPREKEN',
  timing_inschieten: 'TIMING / INSCHIETEN',
  anders: 'ANDERS',
};

export const REVIEW_ACTION_TYPE_ORDER: OpportunityReviewActionType[] = ['uren_ophogen', 'verlenging_bespreken', 'timing_inschieten', 'anders'];

export interface OpportunityReviewProgress {
  /** Denominator: placements with ≥1 detected opportunity — never
   * GEEN DIRECTE GAME-KANS-only placements. */
  opportunityTotal: number;
  reviewedCount: number;
  opvolgen: number;
  geenKans: number;
  later: number;
  /** LATER counts as reviewed — Mission Complete never blocks on it. */
  missionComplete: boolean;
}

/** `reviews` may contain rows for placements outside `placements` (e.g. the
 * full team's reviews when computing one AM's progress) — anything not
 * matching one of `placements` is simply ignored. */
export function buildOpportunityReviewProgress(placements: MissionHuntPlacement[], reviews: OpportunityReview[]): OpportunityReviewProgress {
  const reviewByProjectId = new Map(reviews.map((r) => [r.projectId, r]));
  const opportunityPlacements = placements.filter((p) => hasOpportunitySignal(classifyPlacement(p.startDate, p.endDate, p.hoursPerWeek)));

  let opvolgen = 0;
  let geenKans = 0;
  let later = 0;
  let reviewedCount = 0;

  for (const placement of opportunityPlacements) {
    const review = reviewByProjectId.get(placement.id);
    if (!review) continue;
    reviewedCount += 1;
    if (review.status === 'opvolgen') opvolgen += 1;
    else if (review.status === 'geen_kans') geenKans += 1;
    else later += 1;
  }

  const opportunityTotal = opportunityPlacements.length;
  return { opportunityTotal, reviewedCount, opvolgen, geenKans, later, missionComplete: opportunityTotal > 0 && reviewedCount === opportunityTotal };
}
