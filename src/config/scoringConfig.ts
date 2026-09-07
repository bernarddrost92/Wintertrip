import type { DateRange, Domain, FactorApplicationMode, FactorOption } from '../types/league';

export const DOMAIN_OPTIONS: Domain[] = ['Onderwijs', 'Zorg', 'ICT', 'Techniek', 'Finance', 'W&S', 'Overig'];

/** Official league window: 1 September 2026 through 31 January 2027. */
export const LEAGUE_PERIOD: DateRange = {
  start: '2026-09-01',
  end: '2027-01-31',
};

/** An hours increase only scores from this weekly threshold upward. */
export const MIN_HOURS_INCREASE_PER_WEEK = 4;

/**
 * Whether the ranking Factor is ultimately applied over ALL of a branch's
 * relevant VCDB, or only over VCDB tied to new contractors. This is still an
 * open internal interpretation question — V1's standalone calculator always
 * uses the user's manually selected factor against that single deal's base
 * score, regardless of this setting. This switch exists so future
 * league-wide/dashboard aggregation logic can honor whichever interpretation
 * becomes official without any UI rework.
 */
export const FACTOR_APPLICATION_MODE: FactorApplicationMode = 'ALL_VCDB';

/** Domain value that never scores within Operation January. */
export const NON_SCORING_DOMAIN = 'W&S' as const;

export const WS_WARNING_MESSAGE = 'W&S levert geen punten op binnen Operation January.';

export const HOURS_INCREASE_TOO_SMALL_MESSAGE =
  `Urenuitbreiding van minder dan ${MIN_HOURS_INCREASE_PER_WEEK} uur per week is niet scoorbaar binnen Operation January.`;

/**
 * Manual factor ladder. The Factor reflects the branch's ranking on
 * contractants and is selected by hand in V1 rather than derived
 * automatically.
 */
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

export const MONTH_LABELS_NL = [
  'JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN',
  'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC',
] as const;
