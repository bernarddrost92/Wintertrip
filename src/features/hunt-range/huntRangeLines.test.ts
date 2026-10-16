import { describe, expect, it } from 'vitest';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { nextNetFteTarget, projectStandings } from '../../services/netFteProjection';
import { HUNT_TEST_STANDINGS } from '../hunt/huntTestStandings';
import { RANGE_FTE_EARNED, RANGE_HIT_LINES, RANGE_ROUND_SIZE, buildRound, fillHitLine, getRangeTargets, resultVerdict } from './huntRangeLines';

describe('getRangeTargets', () => {
  it('is every vestiging above Zwolle in Net FTE, nearest first, from the live standings (hidden #6 skipped)', () => {
    const targets = getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 0);
    expect(targets.map((t) => `#${t.rank} ${t.team}`)).toEqual(['#9 Utrecht', '#8 Leeuwarden', '#7 Eindhoven', '#5 Arnhem', '#4 Groningen', '#3 Middelburg', '#2 Breda', '#1 Maastricht']);
    expect(targets[0].fteNeeded).toBe(0.19);
  });

  it('never contains Zwolle and starts at Hunt Mode’s NEXT TARGET, also with open bonnen', () => {
    for (const openFte of [0, 0.5, 4, 12]) {
      const targets = getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, openFte);
      expect(targets.some((t) => t.team === OWN_TEAM)).toBe(false);
      expect(targets[0] ?? null).toEqual(nextNetFteTarget(projectStandings(HUNT_TEST_STANDINGS, OWN_TEAM, openFte)));
    }
  });

  it('is empty once Zwolle is Net FTE #1', () => {
    expect(getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 20)).toEqual([]);
  });
});

describe('buildRound', () => {
  it('five appearances, nearest first, only the nearest marked NEXT TARGET', () => {
    const round = buildRound(getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 0));
    expect(round).toHaveLength(RANGE_ROUND_SIZE);
    expect(round.map((a) => a.target.team)).toEqual(['Utrecht', 'Leeuwarden', 'Eindhoven', 'Arnhem', 'Groningen']);
    expect(round.filter((a) => a.next).map((a) => a.target.team)).toEqual(['Utrecht']);
  });

  it('cycles when fewer than five teams are above Zwolle, with unique ids', () => {
    const targets = getRangeTargets(HUNT_TEST_STANDINGS, OWN_TEAM, 11); // Zwolle #2 → only Maastricht above
    const round = buildRound(targets);
    expect(round.map((a) => a.target.team)).toEqual(Array(5).fill('Maastricht'));
    expect(new Set(round.map((a) => a.id)).size).toBe(5);
  });

  it('no targets → empty round', () => {
    expect(buildRound([])).toEqual([]);
  });
});

describe('copy', () => {
  it('has 15–20 distinct hit lines', () => {
    expect(RANGE_HIT_LINES.length).toBeGreaterThanOrEqual(15);
    expect(RANGE_HIT_LINES.length).toBeLessThanOrEqual(20);
    expect(new Set(RANGE_HIT_LINES.map((l) => l.title + l.body)).size).toBe(RANGE_HIT_LINES.length);
  });

  it('fills in the live target', () => {
    const target = { rank: 9, team: 'Utrecht', netFte: -7.6, fteNeeded: 2.09 };
    expect(fillHitLine(RANGE_HIT_LINES[0], target).title).toBe('TARGET HIT — UTRECHT');
    expect(fillHitLine({ title: 'X', body: '{fte} FTE nodig. {team}.' }, target).body).toBe('+2,09 FTE nodig. Utrecht.');
  });

  it('the verdict, and the FTE earned is always 0', () => {
    expect(resultVerdict(5, 5)).toBe('LEKKER.');
    expect(resultVerdict(3, 5)).toBe('BIJNA PERFECT.');
    expect(resultVerdict(1, 5)).toBe('DAT KAN SCHERPER.');
    expect(resultVerdict(0, 5)).toMatch(/telt dit niet/i);
    expect(RANGE_FTE_EARNED).toBe(0);
  });
});
