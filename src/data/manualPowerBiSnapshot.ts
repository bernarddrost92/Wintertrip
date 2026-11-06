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
  updatedAt: '2026-11-06T05:28:00+01:00',

  // From 6 Nov Antwerpen is in the Final Ranking table itself (#12), so all
  // twelve Net FTE ranks belong to a visible team — no hidden rank any more
  // (#7 on 5 Nov). Antwerpen's blank "Placements Extra" cell is 0.
  // Zwolle's Final Score is the table value: 26,487.69 × 2.0 = 52,975.38.
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 26487.69, placementsInScope: 166, placementsExtraHoursRule: 5, netFteRanking: 2, netFte: 1.72, factor: 2.0, finalScore: 52975.38 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18043.22, placementsInScope: 116, placementsExtraHoursRule: 2, netFteRanking: 1, netFte: 5.85, factor: 2.5, finalScore: 45108.05 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 21710.83, placementsInScope: 182, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -12.36, factor: 1.3, finalScore: 28224.08 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 20574.56, placementsInScope: 169, placementsExtraHoursRule: 9, netFteRanking: 11, netFte: -14.1, factor: 1.0, finalScore: 20574.56 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 18940.39, placementsInScope: 139, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -14.45, factor: 1.0, finalScore: 18940.39 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 13380.42, placementsInScope: 84, placementsExtraHoursRule: 5, netFteRanking: 7, netFte: -2.9, factor: 1.3, finalScore: 17394.55 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 9, vcdbScore: 7652.54, placementsInScope: 58, placementsExtraHoursRule: 2, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13009.31 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9154.92, placementsInScope: 68, placementsExtraHoursRule: 4, netFteRanking: 5, netFte: -1.45, factor: 1.4, finalScore: 12816.89 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9663.85, placementsInScope: 95, placementsExtraHoursRule: 6, netFteRanking: 9, netFte: -3.0, factor: 1.3, finalScore: 12563.0 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 11, vcdbScore: 6772.29, placementsInScope: 74, placementsExtraHoursRule: 6, netFteRanking: 4, netFte: -1.4, factor: 1.5, finalScore: 10158.44 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 10, vcdbScore: 6818.36, placementsInScope: 77, placementsExtraHoursRule: 1, netFteRanking: 6, netFte: -1.9, factor: 1.3, finalScore: 8863.86 },
    { finalRanking: 12, team: 'Antwerpen', vcdbRanking: 12, vcdbScore: 4133.38, placementsInScope: 12, placementsExtraHoursRule: 0, netFteRanking: 8, netFte: -3.0, factor: 1.3, finalScore: 5373.39 },
  ],
};
