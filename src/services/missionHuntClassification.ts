import { compareIsoDates } from '../utils/dates';
import { LEAGUE_PERIOD } from '../config/leagueRules';
import type { IsoDate } from '../types/league';

/**
 * No accountmanager ever picks KANS/UITZOEKEN/GEEN ACTIE by hand anymore —
 * every placement's opportunity status is derived purely from its own start
 * and end date against the shared sales-game period (LEAGUE_PERIOD, defined
 * once in config/leagueRules.ts — reused here rather than duplicated).
 */

/** The four calendar-first-of-month start dates that count as a timing
 * opportunity. 1 September is deliberately excluded: it already counts as
 * the game's own opening day, not a "did we time this well" moment. */
const TIMING_OPPORTUNITY_START_DATES: IsoDate[] = ['2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01'];

/** VERLENGKANS: the placement's end date falls inside the sales-game
 * period (inclusive both ends) — it ends while the game is still live. */
export function isExtensionOpportunity(endDate: IsoDate): boolean {
  return compareIsoDates(endDate, LEAGUE_PERIOD.start) >= 0 && compareIsoDates(endDate, LEAGUE_PERIOD.end) <= 0;
}

/** TIMINGKANS: the placement starts on exactly one of the four qualifying
 * month-starts (Oct/Nov/Dec 2026, Jan 2027). */
export function isTimingOpportunity(startDate: IsoDate): boolean {
  return TIMING_OPPORTUNITY_START_DATES.includes(startDate);
}

export function isDoubleOpportunity(startDate: IsoDate, endDate: IsoDate): boolean {
  return isTimingOpportunity(startDate) && isExtensionOpportunity(endDate);
}

export interface PlacementClassification {
  isTiming: boolean;
  isExtension: boolean;
  /** Both timing and extension at once — the highest-priority case. */
  isDouble: boolean;
  /** Neither — GEEN DIRECTE GAME-KANS. Still shown, never hidden. */
  isGrey: boolean;
}

export function classifyPlacement(startDate: IsoDate, endDate: IsoDate): PlacementClassification {
  const timing = isTimingOpportunity(startDate);
  const extension = isExtensionOpportunity(endDate);
  return {
    isTiming: timing,
    isExtension: extension,
    isDouble: timing && extension,
    isGrey: !timing && !extension,
  };
}

/** Friday Review / My Placements sort order: 1 DOUBLE, 2 VERLENGKANS,
 * 3 TIMINGKANS, 4 GRIJS — lower number sorts first. */
export function classificationPriority(classification: PlacementClassification): number {
  if (classification.isDouble) return 0;
  if (classification.isExtension) return 1;
  if (classification.isTiming) return 2;
  return 3;
}
