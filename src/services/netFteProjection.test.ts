import { describe, expect, it } from 'vitest';
import { MANUAL_POWER_BI_SNAPSHOT, type PowerBiStandingRow } from '../data/manualPowerBiSnapshot';
import {
  factorForNetFteRank,
  factorSteps,
  hiddenNetFteRanks,
  nextFinalRankingTarget,
  nextNetFteTarget,
  projectStandings,
  teamsPassedInNetFte,
} from './netFteProjection';

// The 13 Oct 2026 Final Ranking table (Net FTE rank #6 hidden), pinned here
// so these tests don't change with each day's snapshot.
const STANDINGS: PowerBiStandingRow[] = [
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

describe('factorForNetFteRank — the official factor ladder', () => {
  it.each([
    [1, 2.5],
    [2, 2.0],
    [3, 1.7],
    [4, 1.5],
    [5, 1.4],
    [6, 1.3],
    [10, 1.3],
    [11, 1.0],
    [12, 1.0],
  ])('#%i → %sx', (rank, factor) => {
    expect(factorForNetFteRank(rank)).toBe(factor);
  });

  it('matches every factor in the official table', () => {
    for (const row of STANDINGS) expect(factorForNetFteRank(row.netFteRanking)).toBe(row.factor);
  });
});

describe('hiddenNetFteRanks', () => {
  it('finds the Net FTE rank that belongs to a team not in the Final Ranking', () => {
    expect(hiddenNetFteRanks(STANDINGS)).toEqual([6]);
  });
});

describe('projectStandings', () => {
  it('0 FTE returns the official table unchanged', () => {
    const projection = projectStandings(STANDINGS, 'Zwolle', 0);
    for (const team of projection.teams) {
      expect(team.netFteRanking).toBe(team.official.netFteRanking);
      expect(team.factor).toBe(team.official.factor);
      expect(team.finalScore).toBe(team.official.finalScore);
      expect(team.finalRanking).toBe(team.official.finalRanking);
    }
  });

  it('the worked example: -7,78 + 1,40 open FTE = -6,38, rank #9, +1,49 to pass Leeuwarden', () => {
    const projection = projectStandings(STANDINGS, 'Zwolle', 1.4);
    expect(projection.own.netFte).toBe(-6.38);
    expect(projection.own.netFteRanking).toBe(9);
    expect(projection.own.factor).toBe(1.3);
    expect(teamsPassedInNetFte(projection)).toEqual(['Utrecht']);
    expect(nextNetFteTarget(projection)).toEqual({ rank: 8, team: 'Leeuwarden', netFte: -4.9, fteNeeded: 1.49 });
  });

  it('a new rank with the same factor keeps the official Final Score exactly (no rounding drift)', () => {
    const projection = projectStandings(STANDINGS, 'Zwolle', 1.4);
    expect(projection.own.finalScore).toBe(28731.19);
    expect(projection.teams.find((t) => t.team === 'Utrecht')!.finalScore).toBe(6072.18);
  });

  it('passing a team pushes it down a rank — and can cost it its factor', () => {
    // -7,78 + 7,61 = -0,17 passes Arnhem (-0,18): Zwolle #5 (1,4x), Arnhem #6 (1,3x).
    const projection = projectStandings(STANDINGS, 'Zwolle', 7.61);
    expect(projection.own.netFteRanking).toBe(5);
    expect(projection.own.factor).toBe(1.4);
    expect(projection.own.finalScore).toBe(30941.27);
    const arnhem = projection.teams.find((t) => t.team === 'Arnhem')!;
    expect(arnhem.netFteRanking).toBe(6);
    expect(arnhem.factor).toBe(1.3);
    expect(arnhem.finalScore).toBe(20431.07);
  });

  it('a hidden team is never passed on its own: it counts as level with the team above it', () => {
    // -7,78 + 4,30 = -3,48: above Eindhoven (#7, -3,55) but below Arnhem (#5).
    // The hidden #6 stays above Zwolle → Zwolle lands on #7, not #6.
    const projection = projectStandings(STANDINGS, 'Zwolle', 4.3);
    expect(projection.own.netFteRanking).toBe(7);
    expect(nextNetFteTarget(projection)?.team).toBe('Arnhem');
  });

  it('a negative bon drops Zwolle down the ranking — past #10 the factor falls to 1,0x', () => {
    // -12,78: below Alkmaar (-12,70), above Rotterdam (-19,30).
    const projection = projectStandings(STANDINGS, 'Zwolle', -5);
    expect(projection.own.netFte).toBe(-12.78);
    expect(projection.own.netFteRanking).toBe(11);
    expect(projection.own.factor).toBe(1.0);
  });

  it('throws for a team that is not in the standings', () => {
    expect(() => projectStandings(STANDINGS, 'Den Haag', 1)).toThrow();
  });
});

describe('factorSteps — what each next factor tier takes and gives', () => {
  it('lists every tier above 1,3x with the FTE needed and the Final Score it brings', () => {
    const steps = factorSteps(STANDINGS, 'Zwolle', 0);
    expect(steps.map((s) => [s.factor, s.rank, s.team, s.fteNeeded])).toEqual([
      [1.4, 5, 'Arnhem', 7.61],
      [1.5, 4, 'Groningen', 7.79],
      [1.7, 3, 'Middelburg', 9.79],
      [2.0, 2, 'Breda', 10.84],
      [2.5, 1, 'Maastricht', 11.84],
    ]);
    // At 2,0x Zwolle (44.201,82) passes Maastricht (39.797,68) in the Final Ranking.
    expect(steps[3].finalScore).toBe(44201.82);
    expect(steps[3].finalRanking).toBe(1);
  });

  it('counts from the projection, not the official stand', () => {
    const steps = factorSteps(STANDINGS, 'Zwolle', 1.4);
    expect(steps[0].fteNeeded).toBe(6.21);
  });
});

describe('nextFinalRankingTarget', () => {
  it('names the team above in the Final Ranking with both routes to pass it', () => {
    const target = nextFinalRankingTarget(STANDINGS, 'Zwolle', 0)!;
    expect(target.team).toBe('Maastricht');
    expect(target.pointsBehind).toBe(11066.49);
    expect(target.vcdbNeeded).toBe(8512.7);
    expect(target.fteRoute?.factor).toBe(2.0);
    expect(target.fteRoute?.fteNeeded).toBe(10.84);
  });

  it('null at #1', () => {
    expect(nextFinalRankingTarget(STANDINGS, 'Zwolle', 10.84)).toBeNull();
  });
});

describe('the live snapshot', () => {
  it('every factor matches the official ladder (catches a typo in a pasted row)', () => {
    for (const row of MANUAL_POWER_BI_SNAPSHOT.standings) expect(factorForNetFteRank(row.netFteRanking)).toBe(row.factor);
  });

  it('every Final Score is VCDB × factor, within rounding', () => {
    for (const row of MANUAL_POWER_BI_SNAPSHOT.standings) expect(Math.abs(row.vcdbScore * row.factor - row.finalScore)).toBeLessThan(0.02);
  });

  it('Final Ranking positions are 1…n, ordered by Final Score', () => {
    const sorted = [...MANUAL_POWER_BI_SNAPSHOT.standings].sort((a, b) => a.finalRanking - b.finalRanking);
    sorted.forEach((row, i) => {
      expect(row.finalRanking).toBe(i + 1);
      if (i > 0) expect(row.finalScore).toBeLessThanOrEqual(sorted[i - 1].finalScore);
    });
  });
});
