import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';
import { calculateFteMilestones } from './fteRoad';
import { EMPTY_FTE_SNAPSHOT } from '../types/missionSnapshot';
import type { FteSnapshot, PowerBiIntelligenceSnapshot, RankingSnapshot } from '../types/missionSnapshot';

export interface MissionSnapshot {
  ranking: RankingSnapshot;
  fte: FteSnapshot;
  powerBi: PowerBiIntelligenceSnapshot;
}

/**
 * The single place Mission Control's virtual-position/FTE/Power BI
 * snapshot comes from — today a manual Power BI screenshot
 * (data/manualPowerBiSnapshot.ts). Update ONLY that data file for a new
 * day's numbers; this mapping never needs to change. targetFteOnJan31
 * stays null on purpose — there is no fixed FTE target yet, so the FTE
 * card's benchmark comparison (see fteRoad.ts) is against the CURRENT #1
 * team, never presented as a fixed organisational goal.
 */
export function getMissionSnapshot(): MissionSnapshot {
  const snapshot = MANUAL_POWER_BI_SNAPSHOT;

  const ranking: RankingSnapshot = {
    virtualPosition: snapshot.virtualPosition,
    snapshotUpdatedAt: snapshot.updatedAt,
  };

  const fte: FteSnapshot = {
    ...EMPTY_FTE_SNAPSHOT,
    snapshotUpdatedAt: snapshot.updatedAt,
    currentNetFte: snapshot.netFte,
    netFteRanking: snapshot.netFteRanking,
    currentNumberOneBenchmark: snapshot.currentNumberOneBenchmark,
    currentFteFactor: snapshot.factor,
    fteMilestones: calculateFteMilestones(snapshot.netFte, snapshot.fteMilestones),
  };

  const powerBi: PowerBiIntelligenceSnapshot = {
    vcdbRanking: snapshot.vcdbRanking,
    vcdbScore: snapshot.vcdbScore,
    placementsInScope: snapshot.placementsInScope,
    placementsExtraHoursRule: snapshot.placementsExtraHoursRule,
    finalScore: snapshot.finalScore,
    topThree: snapshot.topThree,
    updatedAt: snapshot.updatedAt,
  };

  return { ranking, fte, powerBi };
}
