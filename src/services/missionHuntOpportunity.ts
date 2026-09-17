import type { PlacementClassification } from './missionHuntClassification';

/** My Placements / Friday Review filter chips. */
export type PlacementFilter = 'all-opportunities' | 'double' | 'verleng' | 'timing' | 'urenkans' | 'grey' | 'all-placements';

export const FILTER_LABEL: Record<PlacementFilter, string> = {
  'all-opportunities': 'ALLE KANSEN',
  double: 'DOUBLE',
  verleng: 'VERLENGEN',
  timing: 'TIMING',
  urenkans: 'URENKANS',
  grey: 'GRIJS',
  'all-placements': 'ALLE PLAATSINGEN',
};

/** Display order everywhere a full filter list renders. */
export const FILTER_ORDER: PlacementFilter[] = ['all-opportunities', 'double', 'verleng', 'timing', 'urenkans', 'grey', 'all-placements'];

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
    case 'urenkans':
      return classification.isUrenkans;
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
export const URENKANS_BADGE: OpportunityBadge = { icon: '🕒', label: 'URENKANS' };

/** Every badge that applies to a placement, in the display order the spec
 * shows them (timing, then urenkans, then verleng, then double last as the
 * loudest one). Additive: URENKANS never replaces any of the others. */
export function badgesForClassification(classification: PlacementClassification): OpportunityBadge[] {
  const badges: OpportunityBadge[] = [];
  if (classification.isTiming) badges.push(TIMING_BADGE);
  if (classification.isUrenkans) badges.push(URENKANS_BADGE);
  if (classification.isExtension) badges.push(VERLENG_BADGE);
  if (classification.isDouble) badges.push(DOUBLE_BADGE);
  if (classification.isGrey) badges.push(GREY_BADGE);
  return badges;
}
