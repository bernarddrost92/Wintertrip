import type { LeagueCheckItem } from '../types/league';

export const LEAGUE_CHECK_ITEMS: LeagueCheckItem[] = [
  {
    id: 'start-date',
    code: '01 START DATE',
    label: 'Klopt de startdatum en kan de deal eerder starten?',
  },
  {
    id: 'end-date',
    code: '02 END DATE',
    label:
      'Ligt de einddatum vlak na 31 januari? Check of 27 januari commercieel én contractueel echt mogelijk is. Belangrijk: nooit een fictieve einddatum gebruiken — alleen aanpassen wanneer dit daadwerkelijk met klant/professional overeengekomen kan worden.',
  },
  {
    id: 'max-duration',
    code: '03 MAX TERM',
    label: 'Is de maximale commerciële looptijd besproken?',
  },
  {
    id: 'all-hours',
    code: '04 ALL HOURS',
    label: 'Zijn alle mogelijke uren meegenomen?',
  },
  {
    id: 'hours-increase-possible',
    code: '05 HOURS +4',
    label: 'Is +4 uur of meer urenuitbreiding mogelijk?',
  },
  {
    id: 'extension-timing',
    code: '06 TIMING 8W',
    label: 'Staat de verlenging minimaal 8 weken voor einddatum op tafel?',
  },
  {
    id: 'purchase-rate',
    code: '07 TARIEF',
    label: 'Is de professional tegen het scherpst haalbare inkooptarief ingekocht?',
  },
  {
    id: 'contractor-status',
    code: '08 CONTRACTANT',
    label: 'Is de contractantstatus correct gecontroleerd?',
  },
  {
    id: 'vcdb-checked',
    code: '09 VCDB / FACTOR',
    label: 'Zijn VCDB, dagwaarde en factor-impact gecontroleerd?',
  },
  {
    id: 'second-pair-of-eyes',
    code: '10 2ND REVIEW',
    label: 'Heeft een tweede paar ogen de deal gecheckt?',
  },
];

export const TEAM_AGREEMENTS = [
  'Iedere plaatsing krijgt een check.',
  'Iedere verlenging krijgt een check.',
  'Vanaf 8 weken voor einddatum start de verlengingsaanval.',
  'Geen administratieve punten laten liggen.',
  'We houden elkaar scherp op: kansen, uren, looptijd, timing.',
];
