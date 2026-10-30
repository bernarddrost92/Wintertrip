import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — derives everything from the official standings table', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #2, read from Zwolle’s own Final Ranking row', () => {
    expect(result.ranking.virtualPosition).toBe(2);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: -8.48, ranking #10, current factor 1.3', () => {
    expect(result.fte.currentNetFte).toBe(-8.48);
    expect(result.fte.netFteRanking).toBe(10);
    expect(result.fte.currentFteFactor).toBe(1.3);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is the Net FTE of whoever holds Net FTE rank #1 (Maastricht, 5.35)', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(5.35);
  });

  it('FTE milestones are the next factor tiers, with the FTE needed to pass each', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 5, team: 'Groningen', gapFte: 7.19 },
      { position: 4, team: 'Eindhoven', gapFte: 7.99 },
      { position: 3, team: 'Breda', gapFte: 9.04 },
      { position: 2, team: 'Middelburg', gapFte: 9.09 },
      { position: 1, team: 'Maastricht', gapFte: 13.84 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Final Score come from Zwolle’s row', () => {
    expect(result.powerBi.vcdbScore).toBe(25272.69);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(32854.5);
    expect(result.powerBi.placementsInScope).toBe(157);
    expect(result.powerBi.placementsExtraHoursRule).toBe(6);
  });

  it('Top 3 is the first three rows of the Final Ranking', () => {
    expect(result.powerBi.topThree).toEqual([
      { position: 1, team: 'Maastricht', finalScore: 43968.35 },
      { position: 2, team: 'Zwolle', finalScore: 32854.5 },
      { position: 3, team: 'Arnhem', finalScore: 26423.94 },
    ]);
  });

  it('the full table is passed through, sorted by Final Ranking', () => {
    expect(result.standings).toHaveLength(11);
    expect(result.standings.map((row) => row.finalRanking)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('snapshot timestamp (date-only — no refresh line in the screenshot) is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-10-30');
    expect(result.powerBi.updatedAt).toBe('2026-10-30');
  });
});
