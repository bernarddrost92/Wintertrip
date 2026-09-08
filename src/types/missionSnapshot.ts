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
};
