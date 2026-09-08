import type { LeagueCheckItem } from '../types/league';

export const LEAGUE_CHECK_ITEMS: LeagueCheckItem[] = [
  {
    id: 'timing',
    code: '01 TIMING',
    label: 'Start de plaatsing / verlenging uiterlijk 31 januari?',
  },
  {
    id: 'end-date',
    code: '02 END DATE',
    label: 'Kan timing/einddatum commercieel en contractueel slimmer?',
  },
  {
    id: 'max-term',
    code: '03 MAX TERM',
    label: 'Is maximale looptijd besproken én is met professional besproken of meer uren mogelijk zijn?',
  },
  {
    id: 'hours',
    code: '04 HOURS',
    label: 'Zijn alle uren meegenomen en is +4 uur uitbreiding mogelijk?',
  },
  {
    id: 'value',
    code: '05 VALUE',
    label: 'Zijn: scherpst haalbare inkooptarief professional, maximaal haalbare klanttarief, VCDB, Factor gecontroleerd?',
  },
  {
    id: 'second-review',
    code: '06 2ND REVIEW',
    label: 'Heeft een tweede AM of TM de deal gecontroleerd?',
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
  'Plaatsing of verlenging moet uiterlijk 31 januari starten.',
  'Geen administratieve punten laten liggen.',
  'We houden elkaar scherp op: kansen, uren, looptijd, timing.',
];
