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
  updatedAt: '2026-11-17',

  // All twelve teams are in the Final Ranking table (Antwerpen #12), so
  // every Net FTE rank 1–12 belongs to a visible team — no hidden rank.
  // Antwerpen's blank "Placements Extra" cell is 0.
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 26752.61, placementsInScope: 176, placementsExtraHoursRule: 7, netFteRanking: 2, netFte: 1.82, factor: 2.0, finalScore: 53505.22 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18035.28, placementsInScope: 126, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 7.2, factor: 2.5, finalScore: 45088.21 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 22808.08, placementsInScope: 195, placementsExtraHoursRule: 9, netFteRanking: 10, netFte: -11.46, factor: 1.3, finalScore: 29650.5 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20755.14, placementsInScope: 182, placementsExtraHoursRule: 13, netFteRanking: 11, netFte: -14.8, factor: 1.0, finalScore: 20755.14 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19068.19, placementsInScope: 145, placementsExtraHoursRule: 1, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19068.19 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 14457.85, placementsInScope: 90, placementsExtraHoursRule: 2, netFteRanking: 9, netFte: -3.1, factor: 1.3, finalScore: 18795.2 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9577.23, placementsInScope: 75, placementsExtraHoursRule: 5, netFteRanking: 4, netFte: -1.45, factor: 1.5, finalScore: 14365.84 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 7974.86, placementsInScope: 63, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13557.26 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 10195.52, placementsInScope: 99, placementsExtraHoursRule: 6, netFteRanking: 7, netFte: -2.3, factor: 1.3, finalScore: 13254.18 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6914.11, placementsInScope: 77, placementsExtraHoursRule: 8, netFteRanking: 6, netFte: -2.3, factor: 1.3, finalScore: 8988.34 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6387.3, placementsInScope: 81, placementsExtraHoursRule: 2, netFteRanking: 5, netFte: -1.9, factor: 1.4, finalScore: 8942.21 },
    { finalRanking: 12, team: 'Antwerpen', vcdbRanking: 12, vcdbScore: 4153.7, placementsInScope: 12, placementsExtraHoursRule: 0, netFteRanking: 8, netFte: -3.0, factor: 1.3, finalScore: 5399.81 },
  ],
};
