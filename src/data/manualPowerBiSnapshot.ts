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
  // updatedAt stays a bare date rather than a fabricated time.
  updatedAt: '2026-10-30',

  // Since 8 Oct the Net FTE ranking runs 1–12 while only 11 teams are in
  // the Final Ranking: rank #6 belongs to a team not shown here (#7 until 19 Oct).
  standings: [
    { finalRanking: 1, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17587.34, placementsInScope: 111, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 5.35, factor: 2.5, finalScore: 43968.35 },
    { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 25272.69, placementsInScope: 157, placementsExtraHoursRule: 6, netFteRanking: 10, netFte: -8.48, factor: 1.3, finalScore: 32854.5 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 3, vcdbScore: 20326.11, placementsInScope: 166, placementsExtraHoursRule: 6, netFteRanking: 9, netFte: -5.53, factor: 1.3, finalScore: 26423.94 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 21263.19, placementsInScope: 164, placementsExtraHoursRule: 9, netFteRanking: 12, netFte: -19.2, factor: 1.0, finalScore: 21263.19 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 18475.09, placementsInScope: 132, placementsExtraHoursRule: 1, netFteRanking: 11, netFte: -17.7, factor: 1.0, finalScore: 18475.09 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 12193.23, placementsInScope: 71, placementsExtraHoursRule: 3, netFteRanking: 5, netFte: -1.3, factor: 1.4, finalScore: 17070.53 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9147.33, placementsInScope: 65, placementsExtraHoursRule: 2, netFteRanking: 4, netFte: -0.5, factor: 1.5, finalScore: 13720.99 },
    { finalRanking: 8, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6554.65, placementsInScope: 66, placementsExtraHoursRule: 4, netFteRanking: 2, netFte: 0.6, factor: 2.0, finalScore: 13109.29 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9325.29, placementsInScope: 88, placementsExtraHoursRule: 4, netFteRanking: 7, netFte: -3.5, factor: 1.3, finalScore: 12122.88 },
    { finalRanking: 10, team: 'Breda', vcdbRanking: 9, vcdbScore: 7095.34, placementsInScope: 50, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: 0.55, factor: 1.7, finalScore: 12062.07 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6354.94, placementsInScope: 69, placementsExtraHoursRule: 2, netFteRanking: 8, netFte: -5.3, factor: 1.3, finalScore: 8261.43 },
  ],
};
