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
  updatedAt: '2026-11-05T05:16:00+01:00',

  // Since 8 Oct the Net FTE ranking runs 1–12 while only 11 teams are in
  // the Final Ranking: rank #7 belongs to a team not shown here (#6 on 2 Nov).
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 26672.82, placementsInScope: 164, placementsExtraHoursRule: 4, netFteRanking: 2, netFte: 1.72, factor: 2.0, finalScore: 53345.65 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17795.44, placementsInScope: 115, placementsExtraHoursRule: 2, netFteRanking: 1, netFte: 5.85, factor: 2.5, finalScore: 44488.6 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 21640.45, placementsInScope: 182, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -13.06, factor: 1.3, finalScore: 28132.58 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20504.67, placementsInScope: 169, placementsExtraHoursRule: 10, netFteRanking: 11, netFte: -14.1, factor: 1.0, finalScore: 20504.67 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 18940.39, placementsInScope: 139, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -14.45, factor: 1.0, finalScore: 18940.39 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 13382.88, placementsInScope: 84, placementsExtraHoursRule: 5, netFteRanking: 8, netFte: -2.9, factor: 1.3, finalScore: 17397.75 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9082.17, placementsInScope: 67, placementsExtraHoursRule: 4, netFteRanking: 5, netFte: -1.45, factor: 1.4, finalScore: 12715.03 },
    { finalRanking: 8, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9593.81, placementsInScope: 93, placementsExtraHoursRule: 5, netFteRanking: 9, netFte: -3.0, factor: 1.3, finalScore: 12471.96 },
    { finalRanking: 9, team: 'Breda', vcdbRanking: 9, vcdbScore: 7247.97, placementsInScope: 55, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 12321.55 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 11, vcdbScore: 6701.9, placementsInScope: 75, placementsExtraHoursRule: 7, netFteRanking: 4, netFte: -1.4, factor: 1.5, finalScore: 10052.86 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 10, vcdbScore: 6851.36, placementsInScope: 76, placementsExtraHoursRule: 1, netFteRanking: 6, netFte: -1.9, factor: 1.3, finalScore: 8906.77 },
  ],
};
