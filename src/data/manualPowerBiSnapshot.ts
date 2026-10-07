/**
 * Today's manual Power BI snapshot — pasted by hand from a screenshot,
 * never a live feed. This is the ONLY file that needs to change for a new
 * day's screenshot: services/missionSnapshot.ts reads it and does a fixed
 * mapping into Mission Control's ranking/FTE/Power BI display types, so no
 * component or service code changes for a new day's numbers.
 */

export interface PowerBiNetFteBenchmark {
  position: number;
  team: string;
  netFte: number;
}

export interface PowerBiTopThreeEntry {
  position: number;
  team: string;
  finalScore: number;
}

export interface ManualPowerBiSnapshot {
  updatedAt: string;

  virtualPosition: number;

  vcdbRanking: number;
  vcdbScore: number;

  placementsInScope: number;
  placementsExtraHoursRule: number;

  /** Zwolle's own position in the Power BI Net FTE ranking. */
  netFteRanking: number;
  /** Zwolle's own Net FTE. */
  netFte: number;
  /** Zwolle's own current FTE factor from that same ranking. */
  factor: number;

  /** Power BI's own Virtual Final Score — a separate snapshot value, never
   * used to overwrite Mission Control's own Base League Points. */
  finalScore: number;

  /** The current #1 team's Net FTE — a dynamic benchmark, not a fixed
   * organisational target (there isn't one yet). */
  currentNumberOneBenchmark: number;

  /** A few reference positions from the same Net FTE ranking, used to show
   * how far Zwolle is from each. Gaps are computed, never hardcoded — see
   * services/fteRoad.ts#calculateFteMilestones. */
  fteMilestones: PowerBiNetFteBenchmark[];

  topThree: PowerBiTopThreeEntry[];
}

export const MANUAL_POWER_BI_SNAPSHOT: ManualPowerBiSnapshot = {
  // Date-only: this screenshot carried no reliable Power BI "last refresh"
  // time, so updatedAt stays a bare date rather than a fabricated time —
  // see IntelligenceStatusSection.tsx's formatPowerBiTime, which renders a
  // date-only string without a time suffix.
  updatedAt: '2026-10-07',

  virtualPosition: 1,

  vcdbRanking: 1,
  vcdbScore: 22177.48,

  placementsInScope: 126,
  placementsExtraHoursRule: 8,

  netFteRanking: 9,
  netFte: -81.51,
  factor: 1.3,

  // The Final Ranking table's own Final Score for Zwolle — NOT the Power
  // BI "Top Team" card, which shows the VCDB Score again by coincidence
  // (22,177.48). The real Final Score is VCDB x Factor: 22,177.48 x 1.3 =
  // 28,830.72 (per the official standings, not a re-derivation here).
  finalScore: 28830.72,

  currentNumberOneBenchmark: -23,

  fteMilestones: [
    { position: 8, team: 'Alkmaar', netFte: -57.35 },
    { position: 5, team: 'Utrecht', netFte: -38.8 },
    { position: 3, team: 'Groningen', netFte: -24.7 },
    { position: 1, team: 'Middelburg', netFte: -23 },
  ],

  topThree: [
    { position: 1, team: 'Zwolle', finalScore: 28830.72 },
    { position: 2, team: 'Rotterdam', finalScore: 20765.14 },
    { position: 3, team: 'Maastricht', finalScore: 19615.6 },
  ],
};
