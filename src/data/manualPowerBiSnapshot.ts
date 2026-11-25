/**
 * Today's manual Power BI snapshot — the official Final Ranking table,
 * pasted by hand from a screenshot, never a live feed. This is the ONLY
 * file that needs to change for a new day's screenshot: copy every team's
 * row exactly as the table shows it. services/missionSnapshot.ts derives
 * Zwolle's own position, FTE ranking, factor, Top 3 and FTE milestones from
 * these rows, and services/netFteProjection.ts projects them — nothing is
 * typed in twice.
 */

/** The team this app is for — its row is the one highlighted everywhere. */
export const OWN_TEAM = 'Zwolle';

/** One row of Power BI's Final Ranking table, exactly as shown. */
export interface PowerBiStandingRow {
  finalRanking: number;
  team: string;
  vcdbRanking: number;
  vcdbScore: number;
  placementsInScope: number;
  /** A blank cell in the table is 0. */
  placementsExtraHoursRule: number;
  /** Position in the Net FTE ranking. That ranking can hold teams that are
   * not in the Final Ranking table (see hiddenNetFteRanks). */
  netFteRanking: number;
  netFte: number;
  factor: number;
  /** The table's own Final Score — never re-derived here. */
  finalScore: number;
}

export interface ManualPowerBiSnapshot {
  updatedAt: string;
  standings: PowerBiStandingRow[];
}

export const MANUAL_POWER_BI_SNAPSHOT: ManualPowerBiSnapshot = {
  // Date-only: the "last refresh" line was cut off in this screenshot, so
  // updatedAt stays a bare date (the day it was shared) rather than a
  // fabricated time.
  updatedAt: '2026-11-25',

  // The Net FTE ranking runs 1–12 while this screenshot shows 11 Final
  // Ranking rows: rank #7 belongs to a team not shown here (Antwerpen —
  // its row is cut off below the visible table).
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 28496.58, placementsInScope: 201, placementsExtraHoursRule: 7, netFteRanking: 2, netFte: 2.59, factor: 2.0, finalScore: 56993.16 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18780.01, placementsInScope: 142, placementsExtraHoursRule: 4, netFteRanking: 1, netFte: 8.3, factor: 2.5, finalScore: 46950.02 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 23898.77, placementsInScope: 209, placementsExtraHoursRule: 10, netFteRanking: 10, netFte: -10.16, factor: 1.3, finalScore: 31068.4 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 21566.24, placementsInScope: 197, placementsExtraHoursRule: 14, netFteRanking: 11, netFte: -14.2, factor: 1.0, finalScore: 21566.24 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19598.28, placementsInScope: 166, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19598.28 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 14592.19, placementsInScope: 98, placementsExtraHoursRule: 5, netFteRanking: 8, netFte: -3.1, factor: 1.3, finalScore: 18969.85 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9877.16, placementsInScope: 83, placementsExtraHoursRule: 5, netFteRanking: 4, netFte: -0.65, factor: 1.5, finalScore: 14815.75 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 8273.58, placementsInScope: 72, placementsExtraHoursRule: 5, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 14065.09 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 10343.07, placementsInScope: 109, placementsExtraHoursRule: 9, netFteRanking: 6, netFte: -2.9, factor: 1.3, finalScore: 13445.98 },
    { finalRanking: 10, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6681.23, placementsInScope: 91, placementsExtraHoursRule: 1, netFteRanking: 5, netFte: -2.05, factor: 1.4, finalScore: 9353.73 },
    { finalRanking: 11, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6984.39, placementsInScope: 84, placementsExtraHoursRule: 11, netFteRanking: 9, netFte: -3.1, factor: 1.3, finalScore: 9079.7 },
  ],
};
