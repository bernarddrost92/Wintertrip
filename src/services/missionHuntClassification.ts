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

/** 1.0 FTE is assumed to be a full 40-hour week — used only to derive
 * URENKANS and a placement's calculated weekly hours for display, never to
 * rewrite the stored FTE itself. */
const FULL_TIME_HOURS_PER_WEEK = 40;

/** URENKANS threshold: strictly less than 0.8 FTE (32 hours). 0.8 itself is
 * NOT an opportunity — the comparison is deliberately `<`, never `<=`. */
const URENKANS_FTE_THRESHOLD = 0.8;

/** URENKANS: this placement is contracted for less than 32 hours/week and
 * may have commercial room to grow. Purely a signal — it never implies the
 * hours will actually increase, and it never touches the stored FTE/DB/
 * contract/dates itself.
 *
 * `null` and `0` (or negative) FTE are never classified as an opportunity —
 * missing or invalid FTE data must not produce a false URENKANS. */
export function isUrenkansOpportunity(fte: number | null): boolean {
  if (fte === null || fte <= 0) return false;
  return fte < URENKANS_FTE_THRESHOLD;
}

/** Rounded weekly hours for display only (e.g. "16 UUR") — derived from the
 * stored FTE, never persisted anywhere. */
export function calculatedWeeklyHours(fte: number | null): number | null {
  if (fte === null) return null;
  return Math.round(fte * FULL_TIME_HOURS_PER_WEEK);
}

export interface PlacementClassification {
  isTiming: boolean;
  isExtension: boolean;
  /** Both timing and extension at once — the highest-priority case. */
  isDouble: boolean;
  /** Neither — GEEN DIRECTE GAME-KANS. Still shown, never hidden. */
  isGrey: boolean;
  /** Additive — a placement can be VERLENGKANS/TIMINGKANS/DOUBLE/GEEN
   * DIRECTE GAME-KANS *and* URENKANS at the same time; this never replaces
   * any of the other four. */
  isUrenkans: boolean;
}

export function classifyPlacement(startDate: IsoDate, endDate: IsoDate, hoursPerWeek: number | null = null): PlacementClassification {
  const timing = isTimingOpportunity(startDate);
  const extension = isExtensionOpportunity(endDate);
  return {
    isTiming: timing,
    isExtension: extension,
    isDouble: timing && extension,
    isGrey: !timing && !extension,
    isUrenkans: isUrenkansOpportunity(hoursPerWeek),
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
