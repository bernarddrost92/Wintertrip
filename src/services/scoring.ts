/**
 * Business scoring layer. Everything here is pure and UI-free — components
 * read its output, they never compute a point themselves. Date/proration
 * math lives one level down in services/proration.ts; this file only
 * orchestrates it into the three mission types and applies the Factor.
 *
 * OFFICIAL scoring model (restored September 2026 — the temporary "full
 * qualifying term, one multiplication, no league-month multiplier"
 * interpretation used between roughly Fase 2 and this change has been
 * reverted and is no longer correct):
 *
 *   STEP 1 — FIXED MONTHLY MISSION VALUE
 *     = qualifying duration in months × VCDB per month
 *     (calendar-day prorated for partial start/end months — see
 *     proration.ts#calculateQualifyingTermBreakdown. This value is FIXED:
 *     it does not change per month.)
 *
 *   STEP 2 — BASE LEAGUE SCORE
 *     = FIXED MONTHLY MISSION VALUE × ACTIVE LEAGUE MONTHS
 *     (the number of league calendar months — 1 September 2026 through 31
 *     January 2027, max 5 — the qualifying term is active in. See
 *     proration.ts#calculateActiveLeagueMonths, the one central helper for
 *     this count.)
 *
 * So the official worked example (8-month placement, VCDB 10/month,
 * starting 1 September) is 8 × 10 = 80 fixed value, × 5 active league
 * months = 400 base league points — never 80 alone. Starting the same deal
 * later in the league linearly loses active league months (October → ×4 =
 * 320, November → ×3 = 240, and so on) — early start is a core strategic
 * lever again. A placement that was already running before 1 September
 * does not count as a new placement at all, regardless of how much of it
 * overlaps the league (see isNewPlacementWithinLeague below) — existing
 * placements never retroactively qualify.
 *
 * 31 January 2027 remains a hard ceiling: months after it are never
 * "active league months", however far the agreed term itself runs (the
 * FIXED MONTHLY MISSION VALUE still uses the term's full duration — only
 * the multiplier stops growing after January).
 */
import { FACTOR_OPTIONS, LEAGUE_PERIOD, MIN_HOURS_INCREASE_PER_WEEK, WS_MESSAGE } from '../config/leagueRules';
import { calculateActiveLeagueMonths, calculateQualifyingTermBreakdown } from './proration';
import type { DealCategory, ExtensionTiming, FactorScenario, HoursIncreaseEligibility, QualifyingTermBreakdown, ScoreResult, ValidationResult } from '../types/scoring';
import type { IsoDate } from '../types/league';
import { compareIsoDates, isValidIsoDate } from '../utils/dates';
import { nextIsoDay } from '../utils/nextDay';

export function applyFactor(baseScore: number, factor: number): number {
  return baseScore * factor;
}

export function calculateFactorImpact(baseScore: number, factor: number): number {
  return applyFactor(baseScore, factor) - baseScore;
}

export function calculateFactorScenarios(baseScore: number, selectedFactor: number): FactorScenario[] {
  return FACTOR_OPTIONS.map((option) => ({
    ...option,
    finalScore: applyFactor(baseScore, option.value),
    isSelected: option.value === selectedFactor,
  }));
}

/** Only DETACHERING deals score within Operatie Wintertrip 2027 — W&S never does. */
export function isLeagueEligibleCategory(dealCategory: DealCategory): boolean {
  return dealCategory === 'DETACHERING';
}

/**
 * NEW_PLACEMENT-only gate: a new placement only counts if it STARTS within
 * the league period itself (01-09-2026 t/m 31-01-2027). A placement that
 * was already running before the league started is an existing placement,
 * never a new one — it scores 0 regardless of how much of its own term
 * later overlaps the league window.
 */
export function isNewPlacementWithinLeague(start: IsoDate): boolean {
  if (!isValidIsoDate(start)) return false;
  return compareIsoDates(start, LEAGUE_PERIOD.start) >= 0 && compareIsoDates(start, LEAGUE_PERIOD.end) <= 0;
}

function buildResult(qualifyingTerm: QualifyingTermBreakdown, activeLeagueMonths: number, factor: number): ScoreResult {
  const fixedMonthlyMissionValue = qualifyingTerm.totalValue;
  const qualifyingDurationMonths = qualifyingTerm.vcdbPerMonth > 0 ? fixedMonthlyMissionValue / qualifyingTerm.vcdbPerMonth : 0;
  const baseScore = fixedMonthlyMissionValue * activeLeagueMonths;
  const finalScore = applyFactor(baseScore, factor);
  return {
    qualifyingTerm,
    qualifyingDurationMonths,
    fixedMonthlyMissionValue,
    activeLeagueMonths,
    baseScore,
    factor,
    finalScore,
    factorImpact: calculateFactorImpact(baseScore, factor),
  };
}

const EMPTY_TERM: QualifyingTermBreakdown = { segments: [], vcdbPerMonth: 0, totalValue: 0 };

function emptyResult(factor: number): ScoreResult {
  return buildResult(EMPTY_TERM, 0, factor);
}

/** Every official scoring path's active-league-months count, pinned to the
 * one official league period — Calculator and Marre Production Feed scoring
 * always call this exact helper, never a second implementation. */
function activeLeagueMonthsFor(start: IsoDate, end: IsoDate): number {
  return calculateActiveLeagueMonths(start, end, LEAGUE_PERIOD.start, LEAGUE_PERIOD.end);
}

// ---------------------------------------------------------------------------
// Validation — no silent invalid calculations. Every UI-facing edge case
// gets a specific, named message rather than a mysteriously blank result.
// ---------------------------------------------------------------------------

export function validateMissionWindow(start: IsoDate, end: IsoDate): ValidationResult {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return { valid: false, message: 'INVALID MISSION WINDOW' };
  if (compareIsoDates(end, start) < 0) return { valid: false, message: 'INVALID MISSION WINDOW' };
  return { valid: true };
}

export function validateVcdb(vcdbPerMonth: number): ValidationResult {
  if (!Number.isFinite(vcdbPerMonth) || vcdbPerMonth <= 0) return { valid: false, message: 'ENTER MONTHLY VCDB' };
  return { valid: true };
}

export function validateExtensionWindow(oldEnd: IsoDate, newEnd: IsoDate): ValidationResult {
  if (!isValidIsoDate(oldEnd) || !isValidIsoDate(newEnd)) return { valid: false, message: 'INVALID MISSION WINDOW' };
  if (compareIsoDates(newEnd, oldEnd) <= 0) return { valid: false, message: 'NO NEW EXTENSION PERIOD' };
  return { valid: true };
}

/**
 * EXTENSION qualification gate: the new term always starts the calendar day
 * after the current end date — there is no separate Award Date input
 * anymore. Whether the extension scores at all depends only on whether that
 * new-term start falls on or before 31 January 2027 (LEAGUE_PERIOD.end).
 */
export function evaluateExtensionTiming(oldEndDate: IsoDate): ExtensionTiming {
  const newTermStart = nextIsoDay(oldEndDate);
  return {
    newTermStart,
    qualifies: compareIsoDates(newTermStart, LEAGUE_PERIOD.end) <= 0,
  };
}

/** An hours increase only scores once it reaches the minimum weekly threshold. */
export function calculateHoursIncreaseEligibility(oldHours: number, newHours: number): HoursIncreaseEligibility {
  const increaseHours = Math.round((newHours - oldHours) * 100) / 100;
  if (increaseHours < MIN_HOURS_INCREASE_PER_WEEK) {
    return { valid: true, eligible: false, increaseHours, message: 'NOT LEAGUE ELIGIBLE' };
  }
  return { valid: true, eligible: true, increaseHours };
}

// ---------------------------------------------------------------------------
// Mission-type score calculations
// ---------------------------------------------------------------------------

/**
 * NEW_PLACEMENT: BASE LEAGUE SCORE = FIXED MONTHLY MISSION VALUE (the
 * calendar-day-prorated qualifying term × VCDB per month) × ACTIVE LEAGUE
 * MONTHS. Only counts at all if the placement STARTS within the league
 * period itself — an existing placement never qualifies as new. W&S deals
 * never score — see isLeagueEligibleCategory.
 */
export function calculateNewPlacementScore(
  start: IsoDate,
  end: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  dealCategory: DealCategory,
): ScoreResult {
  if (!isLeagueEligibleCategory(dealCategory)) return emptyResult(factor);

  const window = validateMissionWindow(start, end);
  const vcdb = validateVcdb(vcdbPerMonth);
  if (!window.valid || !vcdb.valid) return emptyResult(factor);
  if (!isNewPlacementWithinLeague(start)) return emptyResult(factor);

  const qualifyingTerm = calculateQualifyingTermBreakdown(start, end, vcdbPerMonth);
  return buildResult(qualifyingTerm, activeLeagueMonthsFor(start, end), factor);
}

/**
 * EXTENSION: only the newly added term counts, and only if it qualifies.
 * The new term always starts the calendar day after the current end date
 * (evaluateExtensionTiming). If that start falls after 31 January 2027, the
 * extension scores zero outright. Once it qualifies, its FIXED MONTHLY
 * MISSION VALUE covers the newly added term in full through the new end
 * date (however far past January that runs) — but that fixed value is then
 * multiplied by ACTIVE LEAGUE MONTHS, exactly like a new placement, so
 * months past January never add extra multiplier even though they're part
 * of the qualifying term's own duration.
 */
export function calculateExtensionScore(
  oldEndDate: IsoDate,
  newEndDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  dealCategory: DealCategory,
): ScoreResult {
  if (!isLeagueEligibleCategory(dealCategory)) return emptyResult(factor);

  const window = validateExtensionWindow(oldEndDate, newEndDate);
  const vcdb = validateVcdb(vcdbPerMonth);
  if (!window.valid || !vcdb.valid) return emptyResult(factor);

  const { newTermStart, qualifies } = evaluateExtensionTiming(oldEndDate);
  if (!qualifies) return emptyResult(factor);

  const qualifyingTerm = calculateQualifyingTermBreakdown(newTermStart, newEndDate, vcdbPerMonth);
  return buildResult(qualifyingTerm, activeLeagueMonthsFor(newTermStart, newEndDate), factor);
}

/**
 * HOURS_INCREASE: only the extra hours (and their attributable extra VCDB)
 * count, over the full agreed period — same FIXED MONTHLY MISSION VALUE ×
 * ACTIVE LEAGUE MONTHS formula, applied to just the extra VCDB. Below the
 * weekly threshold, the deal scores 0 outright.
 */
export function calculateHoursIncreaseScore(
  oldHours: number,
  newHours: number,
  start: IsoDate,
  end: IsoDate,
  extraVcdbPerMonth: number,
  factor: number,
  dealCategory: DealCategory,
): ScoreResult & HoursIncreaseEligibility {
  const eligibility = calculateHoursIncreaseEligibility(oldHours, newHours);
  if (!isLeagueEligibleCategory(dealCategory) || !eligibility.eligible) {
    return { ...emptyResult(factor), ...eligibility };
  }

  const window = validateMissionWindow(start, end);
  const vcdb = validateVcdb(extraVcdbPerMonth);
  if (!window.valid || !vcdb.valid) {
    return { ...emptyResult(factor), ...eligibility };
  }

  const qualifyingTerm = calculateQualifyingTermBreakdown(start, end, extraVcdbPerMonth);
  return { ...buildResult(qualifyingTerm, activeLeagueMonthsFor(start, end), factor), ...eligibility };
}

export { WS_MESSAGE };
