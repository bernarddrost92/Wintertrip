import type { IsoDate } from './league';

/**
 * Which of the League's three scoring formulas a record maps to — the
 * public feed's "Dealtype" column, normalized. "WS" (W&S) is included here
 * rather than as a separate flag: it never scores, and the central scoring
 * engine already knows that (see services/productionScoring.ts) — this
 * file never re-implements that rule, only routes to it.
 */
export type SheetDealType = 'NIEUWE_PLAATSING' | 'VERLENGING' | 'URENUITBREIDING' | 'WS';

/**
 * The exact field list the sanitized public feed may ever contain — see
 * services/productionFeed.ts and the integration spec it implements.
 * Deliberately excludes `professional`/`client`/any name field: the
 * frontend must never receive them, so there is no property here to leak.
 */
export interface ProductionFeedRecord {
  id: string;
  agreementType: string | null;
  dealType: SheetDealType | null;
  startDate: IsoDate | null;
  oldEndDate: IsoDate | null;
  endDate: IsoDate | null;
  accountManager: string | null;
  /** null = no Talentmanager filled in — allowed, not a data-quality issue (see productionScoring.ts). */
  talentManager: string | null;
  domain: string | null;
  monthlyDb: number | null;
  extraHoursPerWeek: number | null;
  status: string | null;

  /** Google Sheet's own computed columns (N–Q) — carried through for
   * comparison/display, never trusted blindly as the official score. */
  sheetQualifyingStart: IsoDate | null;
  sheetEligible: boolean | null;
  sheetLeagueScore: number | null;
  sheetControl: string | null;
}

/**
 * The loose, string-heavy shape actually received over the wire — Sheets
 * JSON commonly carries numbers as Dutch-locale text and booleans as
 * "TRUE"/"WAAR"/etc. normalizeProductionFeedRecord (services/
 * normalizeProductionFeed.ts) is the one place that turns this into a
 * clean ProductionFeedRecord.
 */
export interface RawProductionFeedRecord {
  id: string;
  agreementType?: string | null;
  dealType?: string | null;
  startDate?: string | null;
  oldEndDate?: string | null;
  endDate?: string | null;
  accountManager?: string | null;
  talentManager?: string | null;
  domain?: string | null;
  monthlyDb?: string | number | null;
  extraHoursPerWeek?: string | number | null;
  status?: string | null;
  sheetQualifyingStart?: string | null;
  sheetEligible?: string | boolean | null;
  sheetLeagueScore?: string | number | null;
  sheetControl?: string | null;
}

export type ProductionSyncStatus = 'live' | 'mock' | 'degraded';

export interface ProductionFeedResult {
  records: ProductionFeedRecord[];
  /** Never presented as real Zwolle production — see Mission Control's DATA SOURCE label. */
  mock: boolean;
  /** True when a live fetch failed and this is the last successful cache. */
  degraded: boolean;
  /** ISO datetime of the data actually being shown — the cached sync time
   * while degraded, not "now". */
  fetchedAt: string;
}
