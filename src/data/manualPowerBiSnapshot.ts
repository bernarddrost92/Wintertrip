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
  updatedAt: '2026-11-24',

  // All twelve teams are in the Final Ranking table (Antwerpen #12, from a
  // second, scrolled screenshot), so every Net FTE rank 1–12 belongs to a
  // visible team — no hidden rank. Antwerpen's blank "Placements Extra"
  // cell is 0.
  standings: [
    { finalRanking: 1, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 28281.04, placementsInScope: 197, placementsExtraHoursRule: 7, netFteRanking: 2, netFte: 2.59, factor: 2.0, finalScore: 56562.08 },
    { finalRanking: 2, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 18577.28, placementsInScope: 136, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 8.3, factor: 2.5, finalScore: 46443.2 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 2, vcdbScore: 23908.56, placementsInScope: 206, placementsExtraHoursRule: 11, netFteRanking: 10, netFte: -10.26, factor: 1.3, finalScore: 31081.12 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 3, vcdbScore: 21032.26, placementsInScope: 194, placementsExtraHoursRule: 12, netFteRanking: 11, netFte: -14.2, factor: 1.0, finalScore: 21032.26 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 19495.71, placementsInScope: 160, placementsExtraHoursRule: 1, netFteRanking: 12, netFte: -15.35, factor: 1.0, finalScore: 19495.71 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 14592.61, placementsInScope: 97, placementsExtraHoursRule: 4, netFteRanking: 8, netFte: -3.1, factor: 1.3, finalScore: 18970.39 },
    { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9823.42, placementsInScope: 83, placementsExtraHoursRule: 5, netFteRanking: 4, netFte: -0.65, factor: 1.5, finalScore: 14735.13 },
    { finalRanking: 8, team: 'Breda', vcdbRanking: 9, vcdbScore: 8047.83, placementsInScope: 68, placementsExtraHoursRule: 3, netFteRanking: 3, netFte: -0.15, factor: 1.7, finalScore: 13681.31 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 10445.11, placementsInScope: 103, placementsExtraHoursRule: 6, netFteRanking: 6, netFte: -2.9, factor: 1.3, finalScore: 13578.65 },
    { finalRanking: 10, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6634.15, placementsInScope: 89, placementsExtraHoursRule: 1, netFteRanking: 5, netFte: -2.05, factor: 1.4, finalScore: 9287.81 },
    { finalRanking: 11, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6992.34, placementsInScope: 80, placementsExtraHoursRule: 8, netFteRanking: 9, netFte: -3.1, factor: 1.3, finalScore: 9090.04 },
    { finalRanking: 12, team: 'Antwerpen', vcdbRanking: 12, vcdbScore: 4672.94, placementsInScope: 13, placementsExtraHoursRule: 0, netFteRanking: 7, netFte: -3.0, factor: 1.3, finalScore: 6074.82 },
  ],
};
