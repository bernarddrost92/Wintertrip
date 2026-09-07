/**
 * All Operation January scoring logic lives here — nowhere else. React
 * components read this module and render its output; they never compute
 * points themselves. This keeps the rule set (which is still subject to
 * change, see FACTOR_APPLICATION_MODE) in one auditable, testable place.
 */
import {
  FACTOR_OPTIONS,
  LEAGUE_PERIOD,
  MIN_HOURS_INCREASE_PER_WEEK,
  MONTH_LABELS_NL,
  NON_SCORING_DOMAIN,
} from '../config/scoringConfig';
import type {
  DateRange,
  Domain,
  FactorComparisonRow,
  IsoDate,
  ScoreBreakdown,
  TimingScenario,
} from '../types/league';
import { calculateDurationMonths, calculateLeagueMonths, isValidIsoDate, parseIsoDate } from '../utils/dates';
import { nextIsoDay } from '../utils/nextDay';

/** True when a domain never earns league points (Werving & Selectie). */
export function isNonScoringDomain(domain: Domain | string | undefined): boolean {
  return domain === NON_SCORING_DOMAIN;
}

export interface HoursIncreaseValidation {
  valid: boolean;
  increaseHours: number;
  message?: string;
}

/** An hours increase only scores once it reaches the minimum weekly threshold. */
export function validateHoursIncrease(oldHours: number, newHours: number): HoursIncreaseValidation {
  const increaseHours = Math.round((newHours - oldHours) * 100) / 100;
  if (increaseHours < MIN_HOURS_INCREASE_PER_WEEK) {
    return {
      valid: false,
      increaseHours,
      message: `Urenstijging van ${increaseHours} u/w is kleiner dan de minimale ${MIN_HOURS_INCREASE_PER_WEEK} u/w — niet scoorbaar.`,
    };
  }
  return { valid: true, increaseHours };
}

/**
 * Core score formula shared by every mission type:
 *   scorePerLeagueMonth = durationMonths × vcdbPerMonth
 *   baseScore           = scorePerLeagueMonth × leagueMonths
 *   finalScore          = baseScore × factor
 */
export function calculateScoreBreakdown(
  startDate: IsoDate,
  endDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  leaguePeriod: DateRange = LEAGUE_PERIOD,
): ScoreBreakdown {
  const durationMonths = calculateDurationMonths(startDate, endDate);
  const leagueMonths = calculateLeagueMonths(startDate, endDate, leaguePeriod.start, leaguePeriod.end);
  const scorePerLeagueMonth = durationMonths * Math.max(0, vcdbPerMonth);
  const baseScore = scorePerLeagueMonth * leagueMonths;
  const finalScore = applyFactor(baseScore, factor);

  return {
    durationMonths,
    leagueMonths,
    scorePerLeagueMonth,
    baseScore,
    factor,
    finalScore,
    factorImpact: calculateFactorImpact(baseScore, factor),
  };
}

/** V1 calculator rule: finalScore = baseScore × the manually selected factor. */
export function applyFactor(baseScore: number, factor: number): number {
  return baseScore * factor;
}

/** Extra points contributed purely by the chosen factor, versus no factor at all. */
export function calculateFactorImpact(baseScore: number, factor: number): number {
  return applyFactor(baseScore, factor) - baseScore;
}

/**
 * Score breakdown for an EXTENSION: only the newly added period (the day
 * after the current end date, through the new end date) counts.
 */
export function calculateExtensionScore(
  currentEndDate: IsoDate,
  newEndDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  leaguePeriod: DateRange = LEAGUE_PERIOD,
): ScoreBreakdown | null {
  if (!isValidIsoDate(currentEndDate) || !isValidIsoDate(newEndDate)) return null;
  if (newEndDate <= currentEndDate) return null;
  const addedStart = nextIsoDay(currentEndDate);
  return calculateScoreBreakdown(addedStart, newEndDate, vcdbPerMonth, factor, leaguePeriod);
}

export interface HoursIncreaseResult extends HoursIncreaseValidation {
  breakdown: ScoreBreakdown | null;
}

/**
 * Score breakdown for an HOURS_INCREASE: only scores once the increase is
 * ≥ MIN_HOURS_INCREASE_PER_WEEK; the supplied vcdbPerMonth is assumed to
 * already represent the incremental (extra-hours-only) VCDB value.
 */
export function calculateHoursIncreaseScore(
  oldHours: number,
  newHours: number,
  startDate: IsoDate,
  endDate: IsoDate,
  vcdbPerMonth: number,
  factor: number,
  leaguePeriod: DateRange = LEAGUE_PERIOD,
): HoursIncreaseResult {
  const validation = validateHoursIncrease(oldHours, newHours);
  if (!validation.valid) {
    return { ...validation, breakdown: null };
  }
  return {
    ...validation,
    breakdown: calculateScoreBreakdown(startDate, endDate, vcdbPerMonth, factor, leaguePeriod),
  };
}

/** "Compare Factors" panel rows: every ladder rung applied to the same base score. */
export function calculateFactorComparison(baseScore: number, selectedFactor: number): FactorComparisonRow[] {
  return FACTOR_OPTIONS.map((option) => ({
    ...option,
    finalScore: applyFactor(baseScore, option.value),
    isSelected: option.value === selectedFactor,
  }));
}

/**
 * Timing-impact scenarios: replays the same deal (duration + VCDB) as if it
 * had started on the 1st of each month that still overlaps the league,
 * proving that an earlier start date is worth strictly more.
 */
export function calculateTimingScenarios(
  durationMonths: number,
  vcdbPerMonth: number,
  leaguePeriod: DateRange = LEAGUE_PERIOD,
): TimingScenario[] {
  if (durationMonths <= 0 || vcdbPerMonth <= 0) return [];

  const { year: startYear, month: startMonth } = parseIsoDate(leaguePeriod.start);
  const { year: endYear, month: endMonth } = parseIsoDate(leaguePeriod.end);
  const firstIndex = startYear * 12 + (startMonth - 1);
  const lastIndex = endYear * 12 + (endMonth - 1);

  const scenarios: TimingScenario[] = [];
  for (let idx = firstIndex; idx <= lastIndex; idx += 1) {
    const year = Math.floor(idx / 12);
    const month = (idx % 12) + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateMonthsLater = addWholeMonthsToDayOne(startDate, durationMonths);
    const leagueMonths = calculateLeagueMonths(startDate, endDateMonthsLater, leaguePeriod.start, leaguePeriod.end);
    scenarios.push({
      monthLabel: MONTH_LABELS_NL[month - 1],
      monthIndex: idx,
      startDate,
      leagueMonths,
      baseScore: durationMonths * vcdbPerMonth * leagueMonths,
    });
  }
  return scenarios;
}

/** Adds N months to a day-01 ISO date and returns the last day of the resulting month. */
function addWholeMonthsToDayOne(dayOneIso: IsoDate, months: number): IsoDate {
  const { year, month } = parseIsoDate(dayOneIso);
  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth1based = (total % 12) + 1;
  // Last day of the *previous* month = last day of the (months-1)-later month,
  // i.e. an N-month duration starting on the 1st ends the day before the N-th
  // month boundary.
  const lastDayIndex = targetYear * 12 + (targetMonth1based - 1) - 1;
  const lastDayYear = Math.floor(lastDayIndex / 12);
  const lastDayMonth1based = (lastDayIndex % 12) + 1;
  const daysInMonth = new Date(Date.UTC(lastDayYear, lastDayMonth1based, 0)).getUTCDate();
  return `${String(lastDayYear).padStart(4, '0')}-${String(lastDayMonth1based).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
}
