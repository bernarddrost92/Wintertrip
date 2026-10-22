import { describe, expect, it } from 'vitest';
import { HUNT_TEST_STANDINGS } from '../features/hunt/huntTestStandings';
import { forecastStandings } from './januaryForecast';

const row = (team: string, netFte: number) => ({ team, fteBaseline: 10, fteMeasure: 10 + netFte, netFte });

describe('forecastStandings', () => {
  const teams = [row('Zwolle', 1.13), row('Maastricht', 5.29), row('Breda', -0.73), row('Arnhem', -12.88), row('Onbekend', 99)];
  const result = forecastStandings(teams, HUNT_TEST_STANDINGS);

  it('ranks on forecast Net FTE, best first, and gives each rank its factor', () => {
    expect(result.map((r) => [r.team, r.netFteRanking, r.factor])).toEqual([
      ['Maastricht', 1, 2.5],
      ['Zwolle', 2, 2.0],
      ['Breda', 3, 1.7],
      ['Arnhem', 4, 1.5],
    ]);
  });

  it('Final Score = today’s official VCDB × the forecast factor, with its own ranking', () => {
    const zwolle = result.find((r) => r.team === 'Zwolle')!;
    expect(zwolle.vcdbScore).toBe(22100.91);
    expect(zwolle.finalScore).toBe(44201.82);
    expect(zwolle.finalRanking).toBe(1);
    expect(result.find((r) => r.team === 'Maastricht')!.finalRanking).toBe(2);
  });

  it('leaves out a team that is not in the official standings', () => {
    expect(result.some((r) => r.team === 'Onbekend')).toBe(false);
  });
});
