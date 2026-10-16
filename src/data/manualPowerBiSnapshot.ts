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
  // updatedAt stays a bare date rather than a fabricated time — see
  // IntelligenceStatusSection.tsx's formatPowerBiTime, which renders a
  // date-only string without a time suffix.
  updatedAt: '2026-10-16',

  // Since 8 Oct the Net FTE ranking runs 1–12 while only 11 teams are in
  // the Final Ranking: rank #7 belongs to a team not shown here.
  standings: [
    { finalRanking: 1, team: 'Maastricht', vcdbRanking: 3, vcdbScore: 16490.88, placementsInScope: 98, placementsExtraHoursRule: 4, netFteRanking: 1, netFte: 4.95, factor: 2.5, finalScore: 41227.2 },
    { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 23047.31, placementsInScope: 135, placementsExtraHoursRule: 6, netFteRanking: 10, netFte: -7.98, factor: 1.3, finalScore: 29961.51 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 4, vcdbScore: 16394.72, placementsInScope: 132, placementsExtraHoursRule: 6, netFteRanking: 6, netFte: -3.28, factor: 1.3, finalScore: 21313.13 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 19706.3, placementsInScope: 145, placementsExtraHoursRule: 7, netFteRanking: 12, netFte: -17.4, factor: 1.0, finalScore: 19706.3 },
    { finalRanking: 5, team: 'Groningen', vcdbRanking: 6, vcdbScore: 11764.19, placementsInScope: 68, placementsExtraHoursRule: 4, netFteRanking: 4, netFte: 0, factor: 1.5, finalScore: 17646.28 },
    { finalRanking: 6, team: 'Alkmaar', vcdbRanking: 5, vcdbScore: 15365.89, placementsInScope: 105, placementsExtraHoursRule: 1, netFteRanking: 11, netFte: -11.9, factor: 1.0, finalScore: 15365.89 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 10, vcdbScore: 6002.46, placementsInScope: 40, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: 2.85, factor: 2.0, finalScore: 12004.92 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 8547.27, placementsInScope: 59, placementsExtraHoursRule: 0, netFteRanking: 5, netFte: -1.75, factor: 1.4, finalScore: 11966.18 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 8589.32, placementsInScope: 77, placementsExtraHoursRule: 4, netFteRanking: 8, netFte: -4.5, factor: 1.3, finalScore: 11166.11 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 9, vcdbScore: 6403.47, placementsInScope: 59, placementsExtraHoursRule: 6, netFteRanking: 3, netFte: 2.0, factor: 1.7, finalScore: 10885.89 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 4742.37, placementsInScope: 50, placementsExtraHoursRule: 1, netFteRanking: 9, netFte: -5.9, factor: 1.3, finalScore: 6165.08 },
  ],
};
