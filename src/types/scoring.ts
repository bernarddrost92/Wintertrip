import type { IsoDate, MissionType } from './league';

export type { MissionType };

/** Only DETACHERING scores within Operatie Wintertrip 2027 — W&S never does. */
export type DealCategory = 'DETACHERING' | 'WS';

/** One calendar month's overlap with a date range, used by both proration dimensions. */
export interface MonthSegment {
  /** "YYYY-MM" */
  monthKey: string;
  year: number;
  month: number; // 1-12
  label: string;
  daysInMonth: number;
  overlapDays: number;
  /** overlapDays / daysInMonth, clamped to [0, 1]. */
  fraction: number;
}

export interface QualifyingTermSegment extends MonthSegment {
  /** fraction × vcdbPerMonth for this calendar month. */
  value: number;
}

export interface QualifyingTermBreakdown {
  segments: QualifyingTermSegment[];
  vcdbPerMonth: number;
  totalValue: number;
}

export interface ScoreResult {
  qualifyingTerm: QualifyingTermBreakdown;
  /** Calendar-day-precise duration of the qualifying term, in months —
   * qualifyingTerm.totalValue / qualifyingTerm.vcdbPerMonth. */
  qualifyingDurationMonths: number;
  /** qualifyingDurationMonths × vcdbPerMonth — the FIXED MONTHLY MISSION
   * VALUE, unchanged across every active league month. Equal to
   * qualifyingTerm.totalValue; kept as its own field for a clearer display
   * name in the Calculator's Show Calculation breakdown. */
  fixedMonthlyMissionValue: number;
  /** Official league-month multiplier — see proration.ts#calculateActiveLeagueMonths. */
  activeLeagueMonths: number;
  /** BASE LEAGUE SCORE = fixedMonthlyMissionValue × activeLeagueMonths. */
  baseScore: number;
  factor: number;
  finalScore: number;
  factorImpact: number;
}

/** EXTENSION-only: whether the newly added term starts on or before the
 * 31 January measurement date — the sole gate on whether an extension
 * scores at all. */
export interface ExtensionTiming {
  newTermStart: IsoDate;
  qualifies: boolean;
}

export interface FactorScenario {
  position: string;
  label: string;
  value: number;
  finalScore: number;
  isSelected: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface HoursIncreaseEligibility extends ValidationResult {
  increaseHours: number;
  eligible: boolean;
}
