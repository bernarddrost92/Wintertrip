/**
 * The weekly Net FTE forecast for the measurement date — totals per
 * vestiging only, worked out by hand from two contract exports (never the
 * exports themselves, which hold personal data): every BPT/VD contract
 * running on the baseline date (1 Sep 2026) and on the measurement date
 * (31 Jan 2027), at its full contract FTE (the export's per-month pro-rata
 * figure scaled back up for part-month contracts); projectovereenkomsten
 * (PO) excluded. Counted by contract vestiging — the rule Power BI is
 * moving to. Replace this file's numbers with each week's new export.
 */

export interface JanuaryForecastRow {
  team: string;
  /** FTE on the baseline date (startmeting). */
  fteBaseline: number;
  /** FTE on the measurement date, as far as known in this week's export. */
  fteMeasure: number;
  /** fteMeasure − fteBaseline, from the unrounded totals. */
  netFte: number;
}

export interface JanuaryForecast {
  /** When this week's export was worked out. */
  calculatedAt: string;
  baselineDate: string;
  measureDate: string;
  teams: JanuaryForecastRow[];
}

export const JANUARY_FORECAST: JanuaryForecast = {
  calculatedAt: '2026-10-22',
  baselineDate: '2026-09-01',
  measureDate: '2027-01-31',
  teams: [
    { team: 'Alkmaar', fteBaseline: 62.51, fteMeasure: 48.52, netFte: -13.98 },
    { team: 'Arnhem', fteBaseline: 105.36, fteMeasure: 92.47, netFte: -12.88 },
    { team: 'Breda', fteBaseline: 27.41, fteMeasure: 26.68, netFte: -0.73 },
    { team: 'Eindhoven', fteBaseline: 31.14, fteMeasure: 28.8, netFte: -2.34 },
    { team: 'Groningen', fteBaseline: 36.34, fteMeasure: 32.8, netFte: -3.54 },
    { team: 'Leeuwarden', fteBaseline: 45.35, fteMeasure: 43.1, netFte: -2.25 },
    { team: 'Maastricht', fteBaseline: 62.16, fteMeasure: 67.45, netFte: 5.29 },
    { team: 'Middelburg', fteBaseline: 30.2, fteMeasure: 29.5, netFte: -0.7 },
    { team: 'Rotterdam', fteBaseline: 92.0, fteMeasure: 75.74, netFte: -16.26 },
    { team: 'Utrecht', fteBaseline: 46.39, fteMeasure: 41.35, netFte: -5.04 },
    { team: 'Zwolle', fteBaseline: 88.64, fteMeasure: 89.77, netFte: 1.13 },
  ],
};
