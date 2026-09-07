import type { LeagueCheckItem } from '../types/league';

export const LEAGUE_CHECK_ITEMS: LeagueCheckItem[] = [
  { id: 'start-date', label: 'Klopt de startdatum?' },
  { id: 'end-date', label: 'Klopt de einddatum?' },
  { id: 'max-duration', label: 'Hebben we maximale commerciële looptijd besproken?' },
  { id: 'all-hours', label: 'Zijn alle uren meegenomen?' },
  { id: 'hours-increase-possible', label: 'Is urenuitbreiding mogelijk?' },
  { id: 'extension-timing', label: 'Is de verlenging op tijd besproken?' },
  { id: 'contractor-status', label: 'Is de contractantstatus gecontroleerd?' },
  { id: 'vcdb-checked', label: 'Is VCDB gecontroleerd?' },
  { id: 'factor-impact', label: 'Is Factor-impact bekeken?' },
  { id: 'second-pair-of-eyes', label: 'Heeft een tweede collega meegekeken?' },
];

export const TEAM_AGREEMENTS = [
  'Iedere plaatsing krijgt een check.',
  'Iedere verlenging krijgt een check.',
  'Vanaf 8 weken voor einddatum start de verlengingsaanval.',
  'Geen administratieve punten laten liggen.',
  'We houden elkaar scherp op: kansen, uren, looptijd, timing.',
];
