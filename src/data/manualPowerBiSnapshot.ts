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
  // Date-only: the "last refresh" line was not in this screenshot, so
  // updatedAt stays a bare date rather than a fabricated time.
  updatedAt: '2026-10-27',

  // Since 8 Oct the Net FTE ranking runs 1–12 while only 11 teams are in
  // the Final Ranking: rank #6 belongs to a team not shown here (#7 until 19 Oct).
  standings: [
    { finalRanking: 1, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17133.47, placementsInScope: 105, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 5.35, factor: 2.5, finalScore: 42833.67 },
    { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 24546.56, placementsInScope: 149, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -9.28, factor: 1.3, finalScore: 31910.53 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 3, vcdbScore: 18906.79, placementsInScope: 152, placementsExtraHoursRule: 6, netFteRanking: 8, netFte: -4.63, factor: 1.3, finalScore: 24578.83 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 20665.56, placementsInScope: 157, placementsExtraHoursRule: 9, netFteRanking: 12, netFte: -17.7, factor: 1.0, finalScore: 20665.56 },
    { finalRanking: 5, team: 'Groningen', vcdbRanking: 6, vcdbScore: 12353.84, placementsInScope: 72, placementsExtraHoursRule: 4, netFteRanking: 4, netFte: -0.7, factor: 1.5, finalScore: 18530.75 },
    { finalRanking: 6, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 17135.62, placementsInScope: 122, placementsExtraHoursRule: 2, netFteRanking: 11, netFte: -16.7, factor: 1.0, finalScore: 17135.62 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 9, vcdbScore: 7169.35, placementsInScope: 49, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: 1.55, factor: 2.0, finalScore: 14338.71 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9058.13, placementsInScope: 65, placementsExtraHoursRule: 2, netFteRanking: 5, netFte: -1.4, factor: 1.4, finalScore: 12681.38 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9289.09, placementsInScope: 85, placementsExtraHoursRule: 4, netFteRanking: 7, netFte: -3.5, factor: 1.3, finalScore: 12075.81 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6448.16, placementsInScope: 63, placementsExtraHoursRule: 4, netFteRanking: 3, netFte: 0.5, factor: 1.7, finalScore: 10961.88 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6153.94, placementsInScope: 65, placementsExtraHoursRule: 2, netFteRanking: 9, netFte: -6.9, factor: 1.3, finalScore: 8000.13 },
  ],
};
