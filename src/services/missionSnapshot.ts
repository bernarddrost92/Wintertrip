import { MANUAL_POWER_BI_SNAPSHOT, OWN_TEAM, type PowerBiStandingRow } from '../data/manualPowerBiSnapshot';
import { factorSteps } from './netFteProjection';
import { EMPTY_FTE_SNAPSHOT } from '../types/missionSnapshot';
import type { FteSnapshot, PowerBiIntelligenceSnapshot, RankingSnapshot } from '../types/missionSnapshot';

export interface MissionSnapshot {
  ranking: RankingSnapshot;
  fte: FteSnapshot;
  powerBi: PowerBiIntelligenceSnapshot;
  /** The full official Final Ranking table, sorted by Final Ranking. */
  standings: PowerBiStandingRow[];
  updatedAt: string;
}

/**
 * The single place Mission Control's position/FTE/Power BI snapshot comes
 * from — today a manual Power BI screenshot (data/manualPowerBiSnapshot.ts).
 * Update ONLY that data file's table for a new day; everything Zwolle-
 * specific is read from Zwolle's own row, and the FTE milestones are the
 * next factor tiers (services/netFteProjection.ts), so nothing is typed in
 * twice. targetFteOnJan31 stays null on purpose — there is no fixed FTE
 * target, only the current ranking.
 */
export function getMissionSnapshot(): MissionSnapshot {
  const { updatedAt } = MANUAL_POWER_BI_SNAPSHOT;
  const standings = [...MANUAL_POWER_BI_SNAPSHOT.standings].sort((a, b) => a.finalRanking - b.finalRanking);
  const own = standings.find((row) => row.team === OWN_TEAM);
  if (!own) throw new Error(`${OWN_TEAM} is missing from the Power BI snapshot`);

  const ranking: RankingSnapshot = {
    virtualPosition: own.finalRanking,
    snapshotUpdatedAt: updatedAt,
  };

  const fte: FteSnapshot = {
    ...EMPTY_FTE_SNAPSHOT,
    snapshotUpdatedAt: updatedAt,
    currentNetFte: own.netFte,
    netFteRanking: own.netFteRanking,
    currentNumberOneBenchmark: standings.find((row) => row.netFteRanking === 1)?.netFte ?? null,
    currentFteFactor: own.factor,
    fteMilestones: factorSteps(standings, OWN_TEAM, 0).map((step) => ({ position: step.rank, team: step.team, gapFte: step.fteNeeded })),
  };

  const powerBi: PowerBiIntelligenceSnapshot = {
    vcdbRanking: own.vcdbRanking,
    vcdbScore: own.vcdbScore,
    placementsInScope: own.placementsInScope,
    placementsExtraHoursRule: own.placementsExtraHoursRule,
    finalScore: own.finalScore,
    topThree: standings.slice(0, 3).map((row) => ({ position: row.finalRanking, team: row.team, finalScore: row.finalScore })),
    updatedAt,
  };

  return { ranking, fte, powerBi, standings, updatedAt };
}
