import type { LeagueCheckItem } from '../types/league';

export const LEAGUE_CHECK_ITEMS: LeagueCheckItem[] = [
  {
    id: 'timing',
    code: '01 TIMING',
    label: 'Start de plaatsing / nieuwe termijn uiterlijk 31 januari?',
  },
  {
    id: 'end-date',
    code: '02 END DATE',
    label:
      'Ligt de einddatum rond 31 januari? Kan de nieuwe termijn commercieel en contractueel echt vóór of op 31 januari starten? Geen fictieve datums gebruiken.',
  },
  {
    id: 'max-term',
    code: '03 MAX TERM',
    label: 'Is de maximale commerciële looptijd besproken en benut?',
  },
  {
    id: 'hours',
    code: '04 HOURS',
    label: 'Zijn alle uren meegenomen en is +4 uur of meer uitbreiding mogelijk?',
  },
  {
    id: 'value',
    code: '05 VALUE',
    label: 'Is de professional tegen het scherpst haalbare inkooptarief ingekocht en zijn VCDB + Factor gecontroleerd?',
  },
  {
    id: 'second-review',
    code: '06 2ND REVIEW',
    label: 'Heeft een tweede paar ogen de deal gecontroleerd?',
  },
];

/** Groups the six checks into the three "mission briefing" blocks — a
 * compact scan pattern rather than one long uniform list. */
export const LEAGUE_CHECK_GROUPS: { label: string; itemIds: string[] }[] = [
  { label: 'Timing', itemIds: ['timing', 'end-date'] },
  { label: 'Value', itemIds: ['max-term', 'hours', 'value'] },
  { label: 'Verify', itemIds: ['second-review'] },
];

export const TEAM_AGREEMENTS = [
  'Iedere plaatsing krijgt een check.',
  'Iedere verlenging krijgt een check.',
  'Nieuwe termijn moet uiterlijk 31 januari starten.',
  'Geen administratieve punten laten liggen.',
  'We houden elkaar scherp op: kansen, uren, looptijd, timing.',
];
