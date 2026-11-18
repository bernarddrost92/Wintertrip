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
  updatedAt: '2026-11-18T05:09:00+01:00',

  // The Net FTE ranking runs 1–12 while this screenshot shows 11 Final
  // Ranking rows: rank #8 belongs to a team not shown here (Antwerpen on
  // 17 Nov — its row is cut off below the visible table).
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 27472.97, placementsInScope: 183, placementsExtraHoursRule: 6, netFteRanking: 2, netFte: 2.52, factor: 2.0, finalScore: 54945.94 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18064.38, placementsInScope: 127, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 7.2, factor: 2.5, finalScore: 45160.95 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 23437.45, placementsInScope: 199, placementsExtraHoursRule: 10, netFteRanking: 10, netFte: -11.56, factor: 1.3, finalScore: 30468.68 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20865.46, placementsInScope: 192, placementsExtraHoursRule: 13, netFteRanking: 11, netFte: -14.8, factor: 1.0, finalScore: 20865.46 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19415.35, placementsInScope: 149, placementsExtraHoursRule: 3, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19415.35 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 14240.19, placementsInScope: 92, placementsExtraHoursRule: 4, netFteRanking: 9, netFte: -3.1, factor: 1.3, finalScore: 18512.25 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9728.23, placementsInScope: 80, placementsExtraHoursRule: 6, netFteRanking: 4, netFte: -1.45, factor: 1.5, finalScore: 14592.34 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 8012.83, placementsInScope: 64, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13621.81 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 10214.74, placementsInScope: 101, placementsExtraHoursRule: 6, netFteRanking: 6, netFte: -2.3, factor: 1.3, finalScore: 13279.16 },
    { finalRanking: 10, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6514.57, placementsInScope: 81, placementsExtraHoursRule: 1, netFteRanking: 5, netFte: -1.9, factor: 1.4, finalScore: 9120.39 },
    { finalRanking: 11, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6895.45, placementsInScope: 77, placementsExtraHoursRule: 8, netFteRanking: 7, netFte: -2.3, factor: 1.3, finalScore: 8964.08 },
  ],
};
