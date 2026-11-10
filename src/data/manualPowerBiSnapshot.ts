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
  updatedAt: '2026-11-10',

  // All twelve teams are in the Final Ranking table (Antwerpen #12), so
  // every Net FTE rank 1–12 belongs to a visible team — no hidden rank.
  // Antwerpen's blank "Placements Extra" cell is 0.
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 26591.73, placementsInScope: 167, placementsExtraHoursRule: 3, netFteRanking: 2, netFte: 1.62, factor: 2.0, finalScore: 53183.45 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17693.78, placementsInScope: 119, placementsExtraHoursRule: 2, netFteRanking: 1, netFte: 6.45, factor: 2.5, finalScore: 44234.46 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 21702.16, placementsInScope: 183, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -11.86, factor: 1.3, finalScore: 28212.81 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20466.43, placementsInScope: 173, placementsExtraHoursRule: 10, netFteRanking: 11, netFte: -13.9, factor: 1.0, finalScore: 20466.43 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19061.92, placementsInScope: 142, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19061.92 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 13728.04, placementsInScope: 88, placementsExtraHoursRule: 5, netFteRanking: 9, netFte: -3.7, factor: 1.3, finalScore: 17846.45 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 9, vcdbScore: 7864.41, placementsInScope: 60, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13369.5 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9342.45, placementsInScope: 69, placementsExtraHoursRule: 3, netFteRanking: 5, netFte: -1.45, factor: 1.4, finalScore: 13079.43 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9909.34, placementsInScope: 97, placementsExtraHoursRule: 6, netFteRanking: 8, netFte: -3.0, factor: 1.3, finalScore: 12882.15 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 11, vcdbScore: 6733.12, placementsInScope: 77, placementsExtraHoursRule: 8, netFteRanking: 4, netFte: -1.4, factor: 1.5, finalScore: 10099.67 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 10, vcdbScore: 6880.12, placementsInScope: 78, placementsExtraHoursRule: 1, netFteRanking: 6, netFte: -1.9, factor: 1.3, finalScore: 8944.15 },
    { finalRanking: 12, team: 'Antwerpen', vcdbRanking: 12, vcdbScore: 4133.38, placementsInScope: 12, placementsExtraHoursRule: 0, netFteRanking: 7, netFte: -3.0, factor: 1.3, finalScore: 5373.39 },
  ],
};
