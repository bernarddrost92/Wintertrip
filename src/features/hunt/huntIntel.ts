import type { PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { nextNetFteTarget, projectStandings, type NetFteTarget } from '../../services/netFteProjection';

export interface HuntIntel {
  vcdbRank: number;
  netFteRank: number;
  factor: number;
  finalPosition: number;
  /** Sum of the open FTE-bonnen (0 while loading/unavailable). */
  openFte: number;
  /** Net FTE and rank with every open bon realised. */
  projectedNetFte: number;
  projectedNetFteRank: number;
  /** The first team above Zwolle in Net FTE, counted from the projection
   * (official + open bonnen) — null when Zwolle is already #1. */
  nextTarget: NetFteTarget | null;
}

/**
 * Everything Hunt Mode and the Mission Ribbon show, read straight from the
 * official standings and the existing projection service — no maths of its
 * own, so a new Power BI snapshot updates Hunt Mode automatically.
 */
export function getHuntIntel(standings: PowerBiStandingRow[], ownTeam: string, openFte: number): HuntIntel {
  const projection = projectStandings(standings, ownTeam, openFte);
  const official = projection.own.official;
  return {
    vcdbRank: official.vcdbRanking,
    netFteRank: official.netFteRanking,
    factor: official.factor,
    finalPosition: official.finalRanking,
    openFte,
    projectedNetFte: projection.own.netFte,
    projectedNetFteRank: projection.own.netFteRanking,
    nextTarget: nextNetFteTarget(projection),
  };
}
