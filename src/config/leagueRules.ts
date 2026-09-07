import type { DateRange, FactorApplicationMode, FactorOption } from '../types/league';

/** Official league window: 1 September 2026 through 31 January 2027. */
export const LEAGUE_PERIOD: DateRange = {
  start: '2026-09-01',
  end: '2027-01-31',
};

/** The five calendar months the league spans, in order. */
export const LEAGUE_MONTHS: { year: number; month: number; label: string }[] = [
  { year: 2026, month: 9, label: 'SEP' },
  { year: 2026, month: 10, label: 'OKT' },
  { year: 2026, month: 11, label: 'NOV' },
  { year: 2026, month: 12, label: 'DEC' },
  { year: 2027, month: 1, label: 'JAN' },
];

/** An hours increase only scores from this weekly threshold upward. */
export const MIN_HOURS_INCREASE_PER_WEEK = 4;

/**
 * Whether the ranking Factor is ultimately applied over ALL of a branch's
 * relevant VCDB, or only over VCDB tied to new contractors. Still an open
 * internal interpretation question — the standalone calculator always uses
 * the user's manually selected factor against that single deal's base score
 * regardless of this setting. This switch exists so future league-wide
 * aggregation logic can honor whichever interpretation becomes official
 * without any UI rework.
 */
export const FACTOR_APPLICATION_MODE: FactorApplicationMode = 'ALL_VCDB';

/**
 * OPEN BUSINESS RULE — needs explicit confirmation.
 *
 * For an EXTENSION, the newly added contract term (old end date + 1 day
 * through the new end date) is unambiguous. What is still open is which
 * date the League Exposure calculation should start counting from:
 *
 * - 'FROM_TERM_START' (current default): exposure is computed over the
 *   added term itself, exactly like a new placement — the extension scores
 *   for every league month the *new contract period* actually covers,
 *   regardless of when the extension was administratively agreed.
 * - 'FROM_AWARD_DATE': exposure only starts counting from the date the
 *   extension was actually agreed/entered (the "award date" collected in
 *   the calculator), so league months that had already passed before the
 *   deal was struck are never credited — even though they fall inside the
 *   added contract term.
 *
 * Both are implemented in services/scoring.ts (see calculateExtensionScore).
 * Flip this single constant once the business decides; no component or
 * other file encodes this assumption anywhere else.
 */
export const EXTENSION_EXPOSURE_MODE: 'FROM_TERM_START' | 'FROM_AWARD_DATE' = 'FROM_TERM_START';

/** Manual factor ladder — the Factor reflects the branch's contractant ranking. */
export const FACTOR_OPTIONS: FactorOption[] = [
  { position: '#1', label: '1e positie', value: 2.5 },
  { position: '#2', label: '2e positie', value: 2.0 },
  { position: '#3', label: '3e positie', value: 1.7 },
  { position: '#4', label: '4e positie', value: 1.5 },
  { position: '#5', label: '5e positie', value: 1.4 },
  { position: '#6 – #10', label: '6e t/m 10e positie', value: 1.3 },
  { position: '—', label: 'Zonder factor', value: 1.0 },
];

export const DEFAULT_FACTOR = FACTOR_OPTIONS[0];
