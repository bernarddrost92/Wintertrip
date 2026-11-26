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
  updatedAt: '2026-11-26T05:17:00+01:00',

  // The Net FTE ranking runs 1–12 while this screenshot shows 11 Final
  // Ranking rows: rank #7 belongs to a team not shown here (Antwerpen —
  // its row is cut off below the visible table).
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 28492.98, placementsInScope: 203, placementsExtraHoursRule: 9, netFteRanking: 2, netFte: 2.59, factor: 2.0, finalScore: 56985.96 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18921.28, placementsInScope: 144, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 8.3, factor: 2.5, finalScore: 47303.2 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 24044.42, placementsInScope: 211, placementsExtraHoursRule: 10, netFteRanking: 10, netFte: -10.16, factor: 1.3, finalScore: 31257.74 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 21758.24, placementsInScope: 199, placementsExtraHoursRule: 14, netFteRanking: 11, netFte: -14.2, factor: 1.0, finalScore: 21758.24 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19606.68, placementsInScope: 167, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19606.68 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 14662.07, placementsInScope: 100, placementsExtraHoursRule: 5, netFteRanking: 8, netFte: -3.1, factor: 1.3, finalScore: 19060.69 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9922.45, placementsInScope: 84, placementsExtraHoursRule: 5, netFteRanking: 4, netFte: -0.65, factor: 1.5, finalScore: 14883.68 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 8375.1, placementsInScope: 74, placementsExtraHoursRule: 5, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 14237.67 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 10381.44, placementsInScope: 111, placementsExtraHoursRule: 9, netFteRanking: 6, netFte: -2.9, factor: 1.3, finalScore: 13495.87 },
    { finalRanking: 10, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6681.96, placementsInScope: 92, placementsExtraHoursRule: 1, netFteRanking: 5, netFte: -2.05, factor: 1.4, finalScore: 9354.75 },
    { finalRanking: 11, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6984.39, placementsInScope: 84, placementsExtraHoursRule: 11, netFteRanking: 9, netFte: -3.1, factor: 1.3, finalScore: 9079.7 },
  ],
};
