import type { PlacementClassification } from './missionHuntClassification';

/** My Placements / Friday Review filter chips. */
export type PlacementFilter = 'all-opportunities' | 'double' | 'verleng' | 'timing' | 'grey' | 'all-placements';

export const FILTER_LABEL: Record<PlacementFilter, string> = {
  'all-opportunities': 'ALLE KANSEN',
  double: 'DOUBLE',
  verleng: 'VERLENGEN',
  timing: 'TIMING',
  grey: 'GRIJS',
  'all-placements': 'ALLE PLAATSINGEN',
};

/** Display order everywhere a full filter list renders. */
export const FILTER_ORDER: PlacementFilter[] = ['all-opportunities', 'double', 'verleng', 'timing', 'grey', 'all-placements'];

export function placementMatchesFilter(classification: PlacementClassification, filter: PlacementFilter): boolean {
  switch (filter) {
    case 'all-placements':
      return true;
    case 'all-opportunities':
      return !classification.isGrey;
    case 'double':
      return classification.isDouble;
    case 'verleng':
      return classification.isExtension;
    case 'timing':
      return classification.isTiming;
    case 'grey':
      return classification.isGrey;
  }
}

export interface OpportunityBadge {
  icon: string;
  label: string;
}

export const TIMING_BADGE: OpportunityBadge = { icon: '🟠', label: 'TIMINGKANS' };
export const VERLENG_BADGE: OpportunityBadge = { icon: '🟡', label: 'VERLENGKANS' };
export const DOUBLE_BADGE: OpportunityBadge = { icon: '🔥', label: 'DOUBLE OPPORTUNITY' };
export const GREY_BADGE: OpportunityBadge = { icon: '⚫', label: 'GEEN DIRECTE GAME-KANS' };

/** Every badge that applies to a placement, in the display order the spec
 * shows them (timing, then verleng, then double last as the loudest one). */
export function badgesForClassification(classification: PlacementClassification): OpportunityBadge[] {
  const badges: OpportunityBadge[] = [];
  if (classification.isTiming) badges.push(TIMING_BADGE);
  if (classification.isExtension) badges.push(VERLENG_BADGE);
  if (classification.isDouble) badges.push(DOUBLE_BADGE);
  if (classification.isGrey) badges.push(GREY_BADGE);
  return badges;
}
