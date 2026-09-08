/**
 * Turns one sanitized feed record into a League score — by calling exactly
 * the same pure functions the Mission Calculator itself uses
 * (services/scoring.ts), never a second, parallel formula. The Factor is
 * always pinned at 1.0x here (see config/leagueRules.ts /
 * FACTOR_OPTIONS[0]) — Mission Control's official score is never
 * multiplied by a ranking factor; only the standalone Calculator lets an AM
 * simulate one.
 *
 * A record's outcome is exactly one of:
 * - "excluded"  — status is explicitly "Geannuleerd"; never counted anywhere.
 * - "pending"   — required fields are missing/invalid; never presented as
 *                 a 0, shown as SCORING PENDING instead.
 * - "scored"    — a real, computed calculatedLeagueScore. This can
 *                 legitimately be 0 (a W&S deal, an hours increase below
 *                 the +4/week threshold, a non-qualifying extension) —
 *                 those are valid, fully-computed outcomes, not missing
 *                 data, so `eligible` distinguishes "counts toward the
 *                 league" from "processed but doesn't qualify".
 */
import {
  calculateExtensionScore,
  calculateHoursIncreaseScore,
  calculateNewPlacementScore,
  evaluateExtensionTiming,
} from './scoring';
import { compareIsoDates, isValidIsoDate } from '../utils/dates';
import type { ProductionFeedRecord } from '../types/productionFeed';

/** Mission Control never applies a ranking factor to the official score. */
const OFFICIAL_FACTOR = 1;

/** Tolerance for comparing our calculation against the Sheet's own League
 * score column (P) — small enough to only absorb genuine rounding noise. */
const SCORE_TOLERANCE = 0.01;

export type SheetComparison = 'verified' | 'mismatch' | 'unavailable';

export type ProductionRecordOutcome =
  | { kind: 'excluded' }
  | { kind: 'pending'; reasons: string[] }
  | { kind: 'scored'; calculatedLeagueScore: number; eligible: boolean; sheetComparison: SheetComparison };

export interface ScoredProductionRecord {
  record: ProductionFeedRecord;
  outcome: ProductionRecordOutcome;
}

function isCancelled(status: string | null): boolean {
  return status !== null && status.trim().toLowerCase() === 'geannuleerd';
}

function compareToSheet(calculated: number, sheetScore: number | null): SheetComparison {
  if (sheetScore === null) return 'unavailable';
  return Math.abs(calculated - sheetScore) <= SCORE_TOLERANCE ? 'verified' : 'mismatch';
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scoreNewPlacement(record: ProductionFeedRecord): ProductionRecordOutcome {
  const reasons: string[] = [];
  if (!isValidIsoDate(record.startDate)) reasons.push('Startdatum controleren');
  if (!isValidIsoDate(record.endDate)) reasons.push('Einddatum controleren');
  if (record.monthlyDb === null) reasons.push('DB ontbreekt');
  if (reasons.length > 0) return { kind: 'pending', reasons };

  if (compareIsoDates(record.endDate as string, record.startDate as string) < 0) {
    return { kind: 'pending', reasons: ['Einddatum controleren'] };
  }

  const result = calculateNewPlacementScore(record.startDate as string, record.endDate as string, record.monthlyDb as number, OFFICIAL_FACTOR, 'DETACHERING');
  const calculatedLeagueScore = round2(result.baseScore);
  return { kind: 'scored', calculatedLeagueScore, eligible: true, sheetComparison: compareToSheet(calculatedLeagueScore, record.sheetLeagueScore) };
}

function scoreExtension(record: ProductionFeedRecord): ProductionRecordOutcome {
  const reasons: string[] = [];
  if (!isValidIsoDate(record.oldEndDate)) reasons.push('Oude einddatum controleren');
  if (!isValidIsoDate(record.endDate)) reasons.push('Einddatum controleren');
  if (record.monthlyDb === null) reasons.push('DB ontbreekt');
  if (reasons.length > 0) return { kind: 'pending', reasons };

  if (compareIsoDates(record.endDate as string, record.oldEndDate as string) <= 0) {
    return { kind: 'pending', reasons: ['Einddatum controleren'] };
  }

  const eligible = evaluateExtensionTiming(record.oldEndDate as string).qualifies;
  const result = calculateExtensionScore(record.oldEndDate as string, record.endDate as string, record.monthlyDb as number, OFFICIAL_FACTOR, 'DETACHERING');
  const calculatedLeagueScore = round2(result.baseScore);
  return { kind: 'scored', calculatedLeagueScore, eligible, sheetComparison: compareToSheet(calculatedLeagueScore, record.sheetLeagueScore) };
}

function scoreHoursIncrease(record: ProductionFeedRecord): ProductionRecordOutcome {
  const reasons: string[] = [];
  if (!isValidIsoDate(record.startDate)) reasons.push('Startdatum controleren');
  if (!isValidIsoDate(record.endDate)) reasons.push('Einddatum controleren');
  if (record.monthlyDb === null) reasons.push('DB ontbreekt');
  if (record.extraHoursPerWeek === null) reasons.push('Extra uren p/w ontbreekt');
  if (reasons.length > 0) return { kind: 'pending', reasons };

  if (compareIsoDates(record.endDate as string, record.startDate as string) < 0) {
    return { kind: 'pending', reasons: ['Einddatum controleren'] };
  }

  // Only the delta is known from the feed — 0 -> extraHoursPerWeek reproduces
  // the exact same eligibility/threshold check the Calculator itself runs.
  const result = calculateHoursIncreaseScore(
    0,
    record.extraHoursPerWeek as number,
    record.startDate as string,
    record.endDate as string,
    record.monthlyDb as number,
    OFFICIAL_FACTOR,
    'DETACHERING',
  );
  const calculatedLeagueScore = round2(result.baseScore);
  return { kind: 'scored', calculatedLeagueScore, eligible: result.eligible, sheetComparison: compareToSheet(calculatedLeagueScore, record.sheetLeagueScore) };
}

/** W&S never scores — routed through the real engine (dealCategory 'WS')
 * rather than a hand-rolled "return 0", so the exclusion rule lives in
 * exactly one place (services/scoring.ts#isLeagueEligibleCategory). */
function scoreWs(record: ProductionFeedRecord): ProductionRecordOutcome {
  const result = calculateNewPlacementScore('2000-01-01', '2000-01-01', record.monthlyDb ?? 0, OFFICIAL_FACTOR, 'WS');
  const calculatedLeagueScore = round2(result.baseScore);
  return { kind: 'scored', calculatedLeagueScore, eligible: false, sheetComparison: compareToSheet(calculatedLeagueScore, record.sheetLeagueScore) };
}

export function scoreProductionRecord(record: ProductionFeedRecord): ScoredProductionRecord {
  if (isCancelled(record.status)) {
    return { record, outcome: { kind: 'excluded' } };
  }
  if (!record.accountManager) {
    return { record, outcome: { kind: 'pending', reasons: ['AM ontbreekt'] } };
  }
  if (record.dealType === null) {
    return { record, outcome: { kind: 'pending', reasons: ['Dealtype onbekend'] } };
  }

  let outcome: ProductionRecordOutcome;
  if (record.dealType === 'WS') outcome = scoreWs(record);
  else if (record.dealType === 'NIEUWE_PLAATSING') outcome = scoreNewPlacement(record);
  else if (record.dealType === 'VERLENGING') outcome = scoreExtension(record);
  else outcome = scoreHoursIncrease(record);

  return { record, outcome };
}

export function scoreProductionFeed(records: ProductionFeedRecord[]): ScoredProductionRecord[] {
  return records.map(scoreProductionRecord);
}
