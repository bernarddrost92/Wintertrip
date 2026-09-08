/**
 * Pure aggregation over ProductionRecord[] — no React, no data-source
 * knowledge, so these functions work identically whether the records came
 * from the manual snapshot or a future live API. Mission Control only ever
 * reads the derived results these return, never the raw records directly.
 */
import type {
  AgentProductionStats,
  ProductionDataQuality,
  ProductionRecord,
  TeamProductionStats,
  TmProductionStats,
  UnassignedProductionStats,
} from '../types/production';

/** Team Zwolle's total production: every record counts exactly once,
 * regardless of how many people (AM + TM) touched it — the AM/TM
 * breakdowns below are contribution views over this same set, not
 * additional placements. */
export function getTeamProduction(records: ProductionRecord[]): TeamProductionStats {
  let knownDb = 0;
  let missingDbCount = 0;
  for (const record of records) {
    if (record.db === null) {
      missingDbCount += 1;
    } else {
      knownDb += record.db;
    }
  }
  return { placementCount: records.length, knownDb, missingDbCount };
}

function aggregateByCode(records: ProductionRecord[], role: 'AM' | 'TM'): AgentProductionStats[] {
  const byCode = new Map<string, AgentProductionStats>();
  for (const record of records) {
    const code = role === 'AM' ? record.accountManager : record.talentManager;
    if (!code) continue;
    const stats = byCode.get(code) ?? { code, role, placementCount: 0, knownDb: 0, missingDbCount: 0 };
    stats.placementCount += 1;
    if (record.db === null) {
      stats.missingDbCount += 1;
    } else {
      stats.knownDb += record.db;
    }
    byCode.set(code, stats);
  }
  return [...byCode.values()].sort((a, b) => b.knownDb - a.knownDb);
}

/** Every AM ranking row, sorted by known DB (highest first) — Section 2's
 * ordering rule. An AM whose only placement(s) still lack DB sorts last,
 * with knownDb 0, rather than being hidden. */
export function getAmProduction(records: ProductionRecord[]): AgentProductionStats[] {
  return aggregateByCode(records, 'AM');
}

/** TM rankings, plus the separate "no TM filled in" bucket — never folded
 * into the ranked list, so it can never be mistaken for an actual person's
 * contribution (Section 3). */
export function getTmProduction(records: ProductionRecord[]): TmProductionStats {
  const agents = aggregateByCode(records, 'TM');

  const unassignedRecords = records.filter((r) => !r.talentManager);
  const unassigned: UnassignedProductionStats = {
    placementCount: unassignedRecords.length,
    knownDb: unassignedRecords.reduce((sum, r) => sum + (r.db ?? 0), 0),
  };

  return { agents, unassigned };
}

export function getProductionDataQuality(records: ProductionRecord[]): ProductionDataQuality {
  const missingTmCount = records.filter((r) => !r.talentManager).length;
  const missingDbCount = records.filter((r) => r.db === null).length;
  const dateCheckCount = records.filter((r) => r.dateQuality === 'needs_review').length;

  return { missingTmCount, missingDbCount, dateCheckCount };
}
