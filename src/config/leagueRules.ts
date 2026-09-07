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
 * EXTENSION rule (settled): there is no Award Date. The new term always
 * starts the calendar day after the current end date. Whether the
 * extension scores AT ALL depends only on whether that new-term start
 * falls on or before LEAGUE_PERIOD.end (31 January 2027) — see
 * services/scoring.ts#evaluateExtensionTiming. Once it qualifies, its Base
 * Score covers the newly added term in full through the new end date,
 * however far past January that runs — 31 January is a qualification gate,
 * never a cutoff on how much of the term counts.
 */

/** Deal categories collected on every mission type. Only DETACHERING scores. */
export const WS_MESSAGE = 'W&S telt niet mee binnen Operatie Wintersport 2027.';

export const DEAL_CATEGORY_OPTIONS: { value: 'DETACHERING' | 'WS'; label: string }[] = [
  { value: 'DETACHERING', label: 'Detachering' },
  { value: 'WS', label: 'W&S' },
];

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
