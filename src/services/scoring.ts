/**
 * Business scoring layer. Everything here is pure and UI-free — components
 * read its output, they never compute a point themselves. Date/proration
 * math lives one level down in services/proration.ts; this file only
 * orchestrates it into the three mission types and applies the Factor.
 */
import {
  EXTENSION_EXPOSURE_MODE,
  FACTOR_OPTIONS,
  LEAGUE_PERIOD,
  MIN_HOURS_INCREASE_PER_WEEK,
} from '../config/leagueRules';
import { calculateBaseLeagueScore, calculateLeagueExposureBreakdown, calculateQualifyingTermBreakdown } from './proration';
import type { FactorScenario, HoursIncreaseEligibility, QualifyingTermBreakdown, ScoreResult, ValidationResult } from '../types/scoring';
import type { IsoDate } from '../types/league';
import { compareIsoDates, isValidIsoDate, maxIsoDate } from '../utils/dates';
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
 */
export function calculateNewPlacementScore(start: IsoDate, end: IsoDate, vcdbPerMonth: number, factor: number): ScoreResult {
  const window = validateMissionWindow(start, end);
  const vcdb = validateVcdb(vcdbPerMonth);
  if (!window.valid || !vcdb.valid) return emptyResult(factor);

  const qualifyingTerm = calculateQualifyingTermBreakdown(start, end, vcdbPerMonth);
  return buildResult(qualifyingTerm, start, end, factor);
}

/**
 * EXTENSION: only the newly added term counts — old end date + 1 day
 * through the new end date. See config/leagueRules.ts#EXTENSION_EXPOSURE_MODE
 * for the (still open) rule on whether League Exposure for that added term
 * starts counting from the term itself or from the deal's award date.
 */
export function calculateExtensionScore(
  oldEndDate: IsoDate,
  newEndDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  awardDate?: IsoDate,
): ScoreResult {
  const window = validateExtensionWindow(oldEndDate, newEndDate);
  const vcdb = validateVcdb(vcdbPerMonth);
  if (!window.valid || !vcdb.valid) return emptyResult(factor);

  const termStart = nextIsoDay(oldEndDate);
  const qualifyingTerm = calculateQualifyingTermBreakdown(termStart, newEndDate, vcdbPerMonth);

  const exposureStart =
    EXTENSION_EXPOSURE_MODE === 'FROM_AWARD_DATE' && awardDate && isValidIsoDate(awardDate)
      ? maxIsoDate(termStart, awardDate)
      : termStart;

  return buildResult(qualifyingTerm, exposureStart, newEndDate, factor);
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
): ScoreResult & HoursIncreaseEligibility {
  const eligibility = calculateHoursIncreaseEligibility(oldHours, newHours);
  if (!eligibility.eligible) {
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
