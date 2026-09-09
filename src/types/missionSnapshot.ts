/**
 * Mission Control's ranking/FTE snapshot — a separate concern from
 * services/productionFeed.ts's deal-level Marre Sheet feed. Sourced from a
 * Power BI export or a manual snapshot, never computed from the League
 * scoring engine, so it is modelled and fetched independently (see
 * services/missionSnapshot.ts).
 */
export interface RankingSnapshot {
  /** Team Zwolle's current virtual League position. null = not yet known — never shown as #0 or a guessed position. */
  virtualPosition: number | null;
  snapshotUpdatedAt: string | null;
}

/** A computed distance (never hardcoded) from Zwolle's current Net FTE to a reference ranking position. */
export interface FteMilestone {
  position: number;
  gapFte: number;
}

/**
 * Net active FTE tracked toward the 31 Jan 2027 measurement date. This is
 * NOT a count of placements made — a placement that ends before 31 Jan and
 * isn't extended contributes nothing to projectedFteOnJan31.
 */
export interface FteSnapshot {
  baselineFte: number | null;
  projectedFteOnJan31: number | null;
  targetFteOnJan31: number | null;
  /** FTE from currently active contracts that lapses before 31 Jan — "at risk", never presented as already lost. */
  expiringBeforeJan31Fte?: number | null;
  snapshotUpdatedAt?: string | null;

  /**
   * Power BI's Net FTE ranking benchmark — a dynamic comparison against
   * the CURRENT #1 team, never a fixed organisational target. Entirely
   * independent of targetFteOnJan31 above, which stays null until a real
   * fixed target exists.
   */
  currentNetFte?: number | null;
  netFteRanking?: number | null;
  currentNumberOneBenchmark?: number | null;
  currentFteFactor?: number | null;
  fteMilestones?: FteMilestone[];
}

/** Power BI's own ranking of teams by Virtual Final Score — never Mission Control's own Base League Points. */
export interface PowerBiTopThreeEntry {
  position: number;
  team: string;
  finalScore: number;
}

export interface PowerBiIntelligenceSnapshot {
  vcdbRanking: number | null;
  vcdbScore: number | null;
  placementsInScope: number | null;
  placementsExtraHoursRule: number | null;
  /** Power BI's own Virtual Final Score — kept strictly separate from Mission Control's Base League Points. */
  finalScore: number | null;
  topThree: PowerBiTopThreeEntry[];
  updatedAt: string | null;
}

export const EMPTY_RANKING_SNAPSHOT: RankingSnapshot = {
  virtualPosition: null,
  snapshotUpdatedAt: null,
};

export const EMPTY_FTE_SNAPSHOT: FteSnapshot = {
  baselineFte: null,
  projectedFteOnJan31: null,
  targetFteOnJan31: null,
  expiringBeforeJan31Fte: null,
  snapshotUpdatedAt: null,
  currentNetFte: null,
  netFteRanking: null,
  currentNumberOneBenchmark: null,
  currentFteFactor: null,
  fteMilestones: [],
};

export const EMPTY_POWER_BI_SNAPSHOT: PowerBiIntelligenceSnapshot = {
  vcdbRanking: null,
  vcdbScore: null,
  placementsInScope: null,
  placementsExtraHoursRule: null,
  finalScore: null,
  topThree: [],
  updatedAt: null,
};
