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
  updatedAt: '2026-09-10',

  virtualPosition: 1,

  vcdbRanking: 1,
  vcdbScore: 13094.89,

  placementsInScope: 73,
  placementsExtraHoursRule: 5,

  netFteRanking: 9,
  netFte: -78.21,
  factor: 1.3,

  finalScore: 17023.36,

  currentNumberOneBenchmark: -23.4,

  fteMilestones: [
    { position: 8, team: 'Alkmaar', netFte: -55.85 },
    { position: 5, team: 'Utrecht', netFte: -38.9 },
    { position: 3, team: 'Breda', netFte: -25.83 },
    { position: 1, team: 'Middelburg', netFte: -23.4 },
  ],

  topThree: [
    { position: 1, team: 'Zwolle', finalScore: 17023.36 },
    { position: 2, team: 'Maastricht', finalScore: 12708.85 },
    { position: 3, team: 'Eindhoven', finalScore: 11946.13 },
  ],
};
