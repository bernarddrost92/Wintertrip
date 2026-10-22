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
  // Power BI's own "Last Refresh Date" line from the screenshot.
  updatedAt: '2026-10-22T04:08:00+02:00',

  // Since 8 Oct the Net FTE ranking runs 1–12 while only 11 teams are in
  // the Final Ranking: rank #6 belongs to a team not shown here (#7 until 19 Oct).
  standings: [
    { finalRanking: 1, team: 'Maastricht', vcdbRanking: 4, vcdbScore: 16705.92, placementsInScope: 103, placementsExtraHoursRule: 4, netFteRanking: 1, netFte: 5.75, factor: 2.5, finalScore: 41764.8 },
    { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 24086.73, placementsInScope: 146, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -8.48, factor: 1.3, finalScore: 31312.75 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 3, vcdbScore: 17410.43, placementsInScope: 141, placementsExtraHoursRule: 7, netFteRanking: 9, netFte: -6.33, factor: 1.3, finalScore: 22633.55 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 20400.38, placementsInScope: 152, placementsExtraHoursRule: 8, netFteRanking: 12, netFte: -18.3, factor: 1.0, finalScore: 20400.38 },
    { finalRanking: 5, team: 'Groningen', vcdbRanking: 6, vcdbScore: 11868.74, placementsInScope: 68, placementsExtraHoursRule: 2, netFteRanking: 4, netFte: 0, factor: 1.5, finalScore: 17803.11 },
    { finalRanking: 6, team: 'Alkmaar', vcdbRanking: 5, vcdbScore: 15945.1, placementsInScope: 113, placementsExtraHoursRule: 2, netFteRanking: 11, netFte: -17.5, factor: 1.0, finalScore: 15945.1 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 9, vcdbScore: 7169.35, placementsInScope: 49, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: 2.85, factor: 2.0, finalScore: 14338.71 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 8803.89, placementsInScope: 61, placementsExtraHoursRule: 1, netFteRanking: 5, netFte: -0.5, factor: 1.4, finalScore: 12325.44 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9065.18, placementsInScope: 83, placementsExtraHoursRule: 4, netFteRanking: 7, netFte: -3.5, factor: 1.3, finalScore: 11784.74 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6573.66, placementsInScope: 61, placementsExtraHoursRule: 5, netFteRanking: 3, netFte: 0.5, factor: 1.7, finalScore: 11175.22 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 5313.55, placementsInScope: 56, placementsExtraHoursRule: 1, netFteRanking: 8, netFte: -5.9, factor: 1.3, finalScore: 6907.62 },
  ],
};
