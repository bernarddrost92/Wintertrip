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
  // the Final Ranking: rank #7 belongs to a team not shown here (#6 from 22 to 30 Oct).
  standings: [
    { finalRanking: 1, team: 'Maastricht', vcdbRanking: 5, vcdbScore: 17587.34, placementsInScope: 111, placementsExtraHoursRule: 3, netFteRanking: 1, netFte: 5.35, factor: 2.5, finalScore: 43968.35 },
    { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 25288.07, placementsInScope: 159, placementsExtraHoursRule: 6, netFteRanking: 5, netFte: -1.58, factor: 1.4, finalScore: 35403.3 },
    { finalRanking: 3, team: 'Arnhem', vcdbRanking: 3, vcdbScore: 20470.99, placementsInScope: 168, placementsExtraHoursRule: 7, netFteRanking: 10, netFte: -12.33, factor: 1.3, finalScore: 26612.29 },
    { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 21078.95, placementsInScope: 163, placementsExtraHoursRule: 9, netFteRanking: 11, netFte: -14.6, factor: 1.0, finalScore: 21078.95 },
    { finalRanking: 5, team: 'Alkmaar', vcdbRanking: 4, vcdbScore: 18475.09, placementsInScope: 133, placementsExtraHoursRule: 2, netFteRanking: 12, netFte: -15.2, factor: 1.0, finalScore: 18475.09 },
    { finalRanking: 6, team: 'Groningen', vcdbRanking: 6, vcdbScore: 12239.73, placementsInScope: 71, placementsExtraHoursRule: 2, netFteRanking: 6, netFte: -2.9, factor: 1.3, finalScore: 15911.64 },
    { finalRanking: 7, team: 'Breda', vcdbRanking: 9, vcdbScore: 7095.34, placementsInScope: 50, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: -0.15, factor: 2.0, finalScore: 14190.67 },
    { finalRanking: 8, team: 'Eindhoven', vcdbRanking: 8, vcdbScore: 9169.57, placementsInScope: 66, placementsExtraHoursRule: 2, netFteRanking: 4, netFte: -1.45, factor: 1.5, finalScore: 13754.35 },
    { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 7, vcdbScore: 9488.05, placementsInScope: 89, placementsExtraHoursRule: 4, netFteRanking: 8, netFte: -3.0, factor: 1.3, finalScore: 12334.46 },
    { finalRanking: 10, team: 'Middelburg', vcdbRanking: 10, vcdbScore: 6543.53, placementsInScope: 66, placementsExtraHoursRule: 3, netFteRanking: 3, netFte: -0.6, factor: 1.7, finalScore: 11123.99 },
    { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 6513.19, placementsInScope: 71, placementsExtraHoursRule: 2, netFteRanking: 9, netFte: -3.4, factor: 1.3, finalScore: 8467.14 },
  ],
};
