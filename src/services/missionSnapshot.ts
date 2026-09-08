import { EMPTY_FTE_SNAPSHOT, EMPTY_RANKING_SNAPSHOT } from '../types/missionSnapshot';
import type { FteSnapshot, RankingSnapshot } from '../types/missionSnapshot';

export interface MissionSnapshot {
  ranking: RankingSnapshot;
  fte: FteSnapshot;
}

/**
 * The single place Mission Control's virtual-position/FTE snapshot will
 * come from once a Power BI or manual snapshot source exists. No such
 * source is wired up yet, so this always returns the safe "no data"
 * defaults — production never shows a fabricated position or FTE figure,
 * only the cards' own AWAITING INTELLIGENCE / AWAITING TARGET states.
 */
export function getMissionSnapshot(): MissionSnapshot {
  return { ranking: EMPTY_RANKING_SNAPSHOT, fte: EMPTY_FTE_SNAPSHOT };
}
