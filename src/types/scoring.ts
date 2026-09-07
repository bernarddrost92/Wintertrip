import type { MissionType } from './league';

export type { MissionType };

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

export interface LeagueExposureBreakdown {
  segments: MonthSegment[];
  totalExposure: number;
}

export interface ScoreResult {
  qualifyingTerm: QualifyingTermBreakdown;
  leagueExposure: LeagueExposureBreakdown;
  baseScore: number;
  factor: number;
  finalScore: number;
  factorImpact: number;
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
