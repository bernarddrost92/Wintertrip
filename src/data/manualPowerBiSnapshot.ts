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
  updatedAt: '2026-11-09',

  // The Net FTE ranking runs 1–12 while this screenshot shows 11 Final
  // Ranking rows: rank #8 belongs to a team not shown here (Antwerpen on
  // 6 Nov — its row is cut off below the visible table).
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 26506.43, placementsInScope: 166, placementsExtraHoursRule: 5, netFteRanking: 2, netFte: 1.72, factor: 2.0, finalScore: 53012.86 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17912.07, placementsInScope: 118, placementsExtraHoursRule: 2, netFteRanking: 1, netFte: 5.65, factor: 2.5, finalScore: 44780.17 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 21580.88, placementsInScope: 184, placementsExtraHoursRule: 9, netFteRanking: 10, netFte: -12.66, factor: 1.3, finalScore: 28055.15 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20316.72, placementsInScope: 171, placementsExtraHoursRule: 10, netFteRanking: 11, netFte: -13.9, factor: 1.0, finalScore: 20316.72 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 18792.25, placementsInScope: 139, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 18792.25 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 13698.02, placementsInScope: 87, placementsExtraHoursRule: 5, netFteRanking: 7, netFte: -2.9, factor: 1.3, finalScore: 17807.43 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9342.45, placementsInScope: 69, placementsExtraHoursRule: 3, netFteRanking: 5, netFte: -1.45, factor: 1.4, finalScore: 13079.43 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 7649.3, placementsInScope: 58, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13003.8 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9760.12, placementsInScope: 97, placementsExtraHoursRule: 7, netFteRanking: 9, netFte: -3.0, factor: 1.3, finalScore: 12688.16 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 11, vcdbScore: 6679.82, placementsInScope: 76, placementsExtraHoursRule: 8, netFteRanking: 4, netFte: -1.4, factor: 1.5, finalScore: 10019.73 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 10, vcdbScore: 6817.88, placementsInScope: 77, placementsExtraHoursRule: 1, netFteRanking: 6, netFte: -1.9, factor: 1.3, finalScore: 8863.24 },
  ],
};
