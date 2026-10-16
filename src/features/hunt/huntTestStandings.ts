import type { PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';

/** Test fixture: the official 13 Oct 2026 table (Net FTE rank #6 hidden), so
 * Hunt Mode tests don't move with each day's snapshot. */
export const HUNT_TEST_STANDINGS: PowerBiStandingRow[] = [
  { finalRanking: 1, team: 'Maastricht', vcdbRanking: 3, vcdbScore: 15919.07, placementsInScope: 92, placementsExtraHoursRule: 4, netFteRanking: 1, netFte: 4.05, factor: 2.5, finalScore: 39797.68 },
  { finalRanking: 2, team: 'Zwolle', vcdbRanking: 1, vcdbScore: 22100.91, placementsInScope: 128, placementsExtraHoursRule: 6, netFteRanking: 10, netFte: -7.78, factor: 1.3, finalScore: 28731.19 },
  { finalRanking: 3, team: 'Arnhem', vcdbRanking: 4, vcdbScore: 15716.21, placementsInScope: 125, placementsExtraHoursRule: 5, netFteRanking: 5, netFte: -0.18, factor: 1.4, finalScore: 22002.7 },
  { finalRanking: 4, team: 'Rotterdam', vcdbRanking: 2, vcdbScore: 18657.67, placementsInScope: 136, placementsExtraHoursRule: 8, netFteRanking: 12, netFte: -19.3, factor: 1.0, finalScore: 18657.67 },
  { finalRanking: 5, team: 'Groningen', vcdbRanking: 6, vcdbScore: 11221.16, placementsInScope: 64, placementsExtraHoursRule: 3, netFteRanking: 4, netFte: 0, factor: 1.5, finalScore: 16831.74 },
  { finalRanking: 6, team: 'Alkmaar', vcdbRanking: 5, vcdbScore: 15272.9, placementsInScope: 103, placementsExtraHoursRule: 1, netFteRanking: 11, netFte: -12.7, factor: 1.0, finalScore: 15272.9 },
  { finalRanking: 7, team: 'Eindhoven', vcdbRanking: 7, vcdbScore: 8420.63, placementsInScope: 57, placementsExtraHoursRule: 0, netFteRanking: 7, netFte: -3.55, factor: 1.3, finalScore: 10946.82 },
  { finalRanking: 8, team: 'Breda', vcdbRanking: 10, vcdbScore: 5383.31, placementsInScope: 35, placementsExtraHoursRule: 2, netFteRanking: 2, netFte: 3.05, factor: 2.0, finalScore: 10766.61 },
  { finalRanking: 9, team: 'Leeuwarden', vcdbRanking: 8, vcdbScore: 8208.46, placementsInScope: 74, placementsExtraHoursRule: 5, netFteRanking: 8, netFte: -4.9, factor: 1.3, finalScore: 10671.0 },
  { finalRanking: 10, team: 'Middelburg', vcdbRanking: 9, vcdbScore: 6002.33, placementsInScope: 54, placementsExtraHoursRule: 6, netFteRanking: 3, netFte: 2.0, factor: 1.7, finalScore: 10203.97 },
  { finalRanking: 11, team: 'Utrecht', vcdbRanking: 11, vcdbScore: 4670.91, placementsInScope: 45, placementsExtraHoursRule: 1, netFteRanking: 9, netFte: -7.6, factor: 1.3, finalScore: 6072.18 },
];
