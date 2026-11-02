import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — derives everything from the official standings table', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #2, read from Zwolle’s own Final Ranking row', () => {
    expect(result.ranking.virtualPosition).toBe(2);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: -0.68, ranking #4, current factor 1.5', () => {
    expect(result.fte.currentNetFte).toBe(-0.68);
    expect(result.fte.netFteRanking).toBe(4);
    expect(result.fte.currentFteFactor).toBe(1.5);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is the Net FTE of whoever holds Net FTE rank #1 (Maastricht, 4.75)', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(4.75);
  });

  it('FTE milestones are the next factor tiers, with the FTE needed to pass each', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 3, team: 'Middelburg', gapFte: 0.09 },
      { position: 2, team: 'Breda', gapFte: 0.54 },
      { position: 1, team: 'Maastricht', gapFte: 5.44 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Final Score come from Zwolle’s row', () => {
    expect(result.powerBi.vcdbScore).toBe(25414.59);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(38121.89);
    expect(result.powerBi.placementsInScope).toBe(158);
    expect(result.powerBi.placementsExtraHoursRule).toBe(3);
  });

  it('Top 3 is the first three rows of the Final Ranking', () => {
    expect(result.powerBi.topThree).toEqual([
      { position: 1, team: 'Maastricht', finalScore: 44739.35 },
      { position: 2, team: 'Zwolle', finalScore: 38121.89 },
      { position: 3, team: 'Arnhem', finalScore: 26192.75 },
    ]);
  });

  it('the full table is passed through, sorted by Final Ranking', () => {
    expect(result.standings).toHaveLength(11);
    expect(result.standings.map((row) => row.finalRanking)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('snapshot timestamp (date-only — no refresh line in the screenshot) is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-11-02');
    expect(result.powerBi.updatedAt).toBe('2026-11-02');
  });
});
