/**
 * Business scoring layer. Everything here is pure and UI-free — components
 * read its output, they never compute a point themselves. Date/proration
 * math lives one level down in services/proration.ts; this file only
 * orchestrates it into the three mission types and applies the Factor.
 */
import { FACTOR_OPTIONS, LEAGUE_PERIOD, MIN_HOURS_INCREASE_PER_WEEK, WS_MESSAGE } from '../config/leagueRules';
import { calculateBaseLeagueScore, calculateLeagueExposureBreakdown, calculateQualifyingTermBreakdown } from './proration';
import type {
  DealCategory,
  FactorScenario,
  HoursIncreaseEligibility,
  QualifyingTermBreakdown,
  ScoreResult,
  ValidationResult,
} from '../types/scoring';
import type { IsoDate } from '../types/league';
import { compareIsoDates, isValidIsoDate, minIsoDate } from '../utils/dates';
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

/** Only DETACHERING deals score within Operation January — W&S never does. */
export function isLeagueEligibleCategory(dealCategory: DealCategory): boolean {
  return dealCategory === 'DETACHERING';
}

function buildResult(qualifyingTerm: QualifyingTermBreakdown, exposureStart: IsoDate, exposureEnd: IsoDate, factor: number): ScoreResult {
  const leagueExposure = calculateLeagueExposureBreakdown(exposureStart, exposureEnd);
  const baseScore = calculateBaseLeagueScore(qualifyingTerm.totalValue, leagueExposure.totalExposure);
  const finalScore = applyFactor(baseScore, factor);
  return {
    qualifyingTerm,
    leagueExposure,
    baseScore,
    factor,
    finalScore,
    factorImpact: calculateFactorImpact(baseScore, factor),
  };
}

const EMPTY_TERM: QualifyingTermBreakdown = { segments: [], vcdbPerMonth: 0, totalValue: 0 };

function emptyResult(factor: number): ScoreResult {
  return buildResult(EMPTY_TERM, LEAGUE_PERIOD.start, LEAGUE_PERIOD.end, factor);
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

export function validateAwardDate(awardDate: IsoDate): ValidationResult {
  if (!isValidIsoDate(awardDate)) return { valid: false, message: 'AWARD DATE REQUIRED' };
  return { valid: true };
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
 * NEW_PLACEMENT: Qualifying Term Value covers the entire placement period
 * (including any part that runs past the league end); League Exposure caps
 * that same period to how much of each league month it actually touches.
 * W&S deals (dealCategory) never score — see isLeagueEligibleCategory.
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

  const qualifyingTerm = calculateQualifyingTermBreakdown(start, end, vcdbPerMonth);
  return buildResult(qualifyingTerm, start, end, factor);
}

/**
 * EXTENSION: only the newly added term counts for the Qualifying Term Value
 * — old end date + 1 day through the new end date, exactly like a fresh
 * placement of just that added period.
 *
 * League Exposure, however, is anchored to the Award Date rather than to
 * the added term's own calendar position: it runs from the Award Date
 * through min(newEndDate, LEAGUE_PERIOD.end). A deal awarded on 15 October
 * for months that only start the following February still earns exposure
 * for Oct(partial)/Nov/Dec/Jan — the value was locked in for the league on
 * the day the extension was struck, so it isn't zeroed out just because the
 * added contract months themselves fall after the league window. An award
 * date after the league has already closed correctly yields zero exposure.
 */
export function calculateExtensionScore(
  oldEndDate: IsoDate,
  newEndDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  awardDate: IsoDate,
  dealCategory: DealCategory,
): ScoreResult {
  if (!isLeagueEligibleCategory(dealCategory)) return emptyResult(factor);

  const window = validateExtensionWindow(oldEndDate, newEndDate);
  const vcdb = validateVcdb(vcdbPerMonth);
  const award = validateAwardDate(awardDate);
  if (!window.valid || !vcdb.valid || !award.valid) return emptyResult(factor);

  const termStart = nextIsoDay(oldEndDate);
  const qualifyingTerm = calculateQualifyingTermBreakdown(termStart, newEndDate, vcdbPerMonth);

  const exposureEnd = minIsoDate(newEndDate, LEAGUE_PERIOD.end);
  return buildResult(qualifyingTerm, awardDate, exposureEnd, factor);
}

/**
 * HOURS_INCREASE: only the extra hours (and their attributable extra VCDB)
 * count. Below the weekly threshold, the deal scores 0 outright.
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
  return { ...buildResult(qualifyingTerm, start, end, factor), ...eligibility };
}

export { WS_MESSAGE };
