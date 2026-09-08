import { parseDutchNumber } from '../utils/parseDutchNumber';
import { isValidIsoDate } from '../utils/dates';
import type { ProductionFeedRecord, RawProductionFeedRecord, SheetDealType } from '../types/productionFeed';

const DEAL_TYPE_ALIASES: Record<string, SheetDealType> = {
  'nieuwe plaatsing': 'NIEUWE_PLAATSING',
  plaatsing: 'NIEUWE_PLAATSING',
  nieuw: 'NIEUWE_PLAATSING',
  verlenging: 'VERLENGING',
  urenuitbreiding: 'URENUITBREIDING',
  'w&s': 'WS',
  ws: 'WS',
};

/** Accepts the already-canonical codes too, so a feed that sends them
 * directly (rather than the Dutch label) still normalizes cleanly. */
function normalizeDealType(raw: string | null | undefined): SheetDealType | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (DEAL_TYPE_ALIASES[key]) return DEAL_TYPE_ALIASES[key];
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (upper === 'NIEUWE_PLAATSING' || upper === 'VERLENGING' || upper === 'URENUITBREIDING' || upper === 'WS') {
    return upper as SheetDealType;
  }
  return null;
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return isValidIsoDate(raw) ? raw : null;
}

const TRUTHY_DUTCH = new Set(['true', 'waar', 'ja', 'yes', '1']);
const FALSY_DUTCH = new Set(['false', 'onwaar', 'nee', 'no', '0']);

function normalizeBoolean(raw: string | boolean | null | undefined): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (TRUTHY_DUTCH.has(key)) return true;
  if (FALSY_DUTCH.has(key)) return false;
  return null;
}

function nullableText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/** The one place a raw feed record (loose, string-heavy, exactly as Sheets
 * JSON tends to arrive) becomes a clean ProductionFeedRecord. Never touches
 * professional/client names — the raw shape has no field for them to begin
 * with (see types/productionFeed.ts). */
export function normalizeProductionFeedRecord(raw: RawProductionFeedRecord): ProductionFeedRecord {
  return {
    id: raw.id,
    agreementType: nullableText(raw.agreementType),
    dealType: normalizeDealType(raw.dealType),
    startDate: normalizeDate(raw.startDate),
    oldEndDate: normalizeDate(raw.oldEndDate),
    endDate: normalizeDate(raw.endDate),
    accountManager: nullableText(raw.accountManager),
    talentManager: nullableText(raw.talentManager),
    domain: nullableText(raw.domain),
    monthlyDb: parseDutchNumber(raw.monthlyDb),
    extraHoursPerWeek: parseDutchNumber(raw.extraHoursPerWeek),
    status: nullableText(raw.status),
    sheetQualifyingStart: normalizeDate(raw.sheetQualifyingStart),
    sheetEligible: normalizeBoolean(raw.sheetEligible),
    sheetLeagueScore: parseDutchNumber(raw.sheetLeagueScore),
    sheetControl: nullableText(raw.sheetControl),
  };
}
