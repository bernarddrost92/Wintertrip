/**
 * Business scoring layer. Everything here is pure and UI-free — components
 * read its output, they never compute a point themselves. Date/proration
 * math lives one level down in services/proration.ts; this file only
 * orchestrates it into the three mission types and applies the Factor.
 *
 * Scoring model (settled): BASE SCORE = VCDB per month × the full
 * qualifying term (calendar-day prorated). There is no separate "League
 * Exposure" multiplier and no fixed five-month (Sep–Jan) window applied to
 * the score — the entire agreed term counts, however far past January it
 * runs. The only place 31 January 2027 still matters is as the EXTENSION
 * qualification gate (see calculateExtensionScore below).
 */
import { FACTOR_OPTIONS, LEAGUE_PERIOD, MIN_HOURS_INCREASE_PER_WEEK, WS_MESSAGE } from '../config/leagueRules';
import { calculateQualifyingTermBreakdown } from './proration';
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

/** Only DETACHERING deals score within Operatie Wintersport 2027 — W&S never does. */
export function isLeagueEligibleCategory(dealCategory: DealCategory): boolean {
  return dealCategory === 'DETACHERING';
}

function buildResult(qualifyingTerm: QualifyingTermBreakdown, factor: number): ScoreResult {
  const baseScore = qualifyingTerm.totalValue;
  const finalScore = applyFactor(baseScore, factor);
  return {
    qualifyingTerm,
    baseScore,
    factor,
    finalScore,
    factorImpact: calculateFactorImpact(baseScore, factor),
  };
}

const EMPTY_TERM: QualifyingTermBreakdown = { segments: [], vcdbPerMonth: 0, totalValue: 0 };

function emptyResult(factor: number): ScoreResult {
  return buildResult(EMPTY_TERM, factor);
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
 * NEW_PLACEMENT: Base Score is the Qualifying Term Value over the entire
 * agreed placement period — calendar-day prorated for any partial start or
 * end month, with no cap at the league window. W&S deals never score — see
 * isLeagueEligibleCategory.
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
  return buildResult(qualifyingTerm, factor);
}

/**
 * EXTENSION: only the newly added term counts, and only if it qualifies.
 * The new term always starts the calendar day after the current end date
 * (evaluateExtensionTiming). If that start falls after 31 January 2027, the
 * extension scores zero outright — a deal that qualifies is never truncated
 * at January, though: its Base Score covers the newly added term in full,
 * all the way through the new end date, however far past January that runs.
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
  return buildResult(qualifyingTerm, factor);
}

/**
 * HOURS_INCREASE: only the extra hours (and their attributable extra VCDB)
 * count, over the full agreed period. Below the weekly threshold, the deal
 * scores 0 outright.
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
  return { ...buildResult(qualifyingTerm, factor), ...eligibility };
}

export { WS_MESSAGE };
