/**
 * League Check "found points" — the commercial improvement a League Check
 * actually surfaced, strictly separated from the ranking Factor.
 *
 * The Factor is an office/ranking multiplier, never a commercial win the
 * League Check itself produced. BEFORE and AFTER are therefore compared
 * like-for-like on the Base Score alone — a Base Score that never moved
 * means zero found points, no matter how much the Factor changed in the
 * same session.
 */
export interface FoundPoints {
  /** AFTER Base Score minus BEFORE Base Score — never affected by Factor. */
  foundBasePoints: number;
  /** foundBasePoints × the currently selected Factor. */
  foundLeaguePoints: number;
}

export function calculateFoundPoints(beforeBaseScore: number, afterBaseScore: number, selectedFactor: number): FoundPoints {
  const foundBasePoints = afterBaseScore - beforeBaseScore;
  return {
    foundBasePoints,
    foundLeaguePoints: foundBasePoints * selectedFactor,
  };
}
