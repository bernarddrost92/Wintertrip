import type { PowerBiStandingRow } from '../data/manualPowerBiSnapshot';
import type { JanuaryForecastRow } from '../data/januaryForecast';
import { factorForNetFteRank } from './netFteProjection';

export interface ForecastStanding extends JanuaryForecastRow {
  netFteRanking: number;
  factor: number;
  /** Today's official VCDB — the forecast only moves Net FTE. */
  vcdbScore: number;
  finalScore: number;
  finalRanking: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The forecast Net FTE ranking (best first) with the factor each rank earns,
 * and the Final Score that factor gives on today's official VCDB. Only teams
 * present in both the forecast and the official standings are ranked.
 */
export function forecastStandings(teams: JanuaryForecastRow[], standings: PowerBiStandingRow[]): ForecastStanding[] {
  const ranked = teams
    .map((row) => ({ row, official: standings.find((s) => s.team === row.team) }))
    .filter((x): x is { row: JanuaryForecastRow; official: PowerBiStandingRow } => x.official !== undefined)
    .sort((a, b) => b.row.netFte - a.row.netFte)
    .map(({ row, official }, i) => {
      const factor = factorForNetFteRank(i + 1);
      return { ...row, netFteRanking: i + 1, factor, vcdbScore: official.vcdbScore, finalScore: round2(official.vcdbScore * factor), finalRanking: 0 };
    });
  const byFinal = [...ranked].sort((a, b) => b.finalScore - a.finalScore);
  return ranked.map((t) => ({ ...t, finalRanking: byFinal.indexOf(t) + 1 }));
}
