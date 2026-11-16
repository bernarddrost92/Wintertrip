import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — derives everything from the official standings table', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #1, read from Zwolle’s own Final Ranking row', () => {
    expect(result.ranking.virtualPosition).toBe(1);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: 1.62, ranking #2, current factor 2.0', () => {
    expect(result.fte.currentNetFte).toBe(1.62);
    expect(result.fte.netFteRanking).toBe(2);
    expect(result.fte.currentFteFactor).toBe(2.0);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is the Net FTE of whoever holds Net FTE rank #1 (Maastricht, 7.2)', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(7.2);
  });

  it('FTE milestones are the next factor tiers, with the FTE needed to pass each', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 1, team: 'Maastricht', gapFte: 5.59 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Final Score come from Zwolle’s row', () => {
    expect(result.powerBi.vcdbScore).toBe(26600.89);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(53201.78);
    expect(result.powerBi.placementsInScope).toBe(174);
    expect(result.powerBi.placementsExtraHoursRule).toBe(6);
  });

  it('Top 3 is the first three rows of the Final Ranking', () => {
    expect(result.powerBi.topThree).toEqual([
      { position: 1, team: 'Zwolle', finalScore: 53201.78 },
      { position: 2, team: 'Maastricht', finalScore: 44876.83 },
      { position: 3, team: 'Arnhem', finalScore: 29577.43 },
    ]);
  });

  it('the full table is passed through, sorted by Final Ranking', () => {
    expect(result.standings).toHaveLength(12);
    expect(result.standings.map((row) => row.finalRanking)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('snapshot timestamp (date-only — no refresh line in the screenshot) is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-11-16');
    expect(result.powerBi.updatedAt).toBe('2026-11-16');
  });
});
