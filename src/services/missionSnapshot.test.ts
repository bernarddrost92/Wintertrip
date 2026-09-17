import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — maps the manual Power BI snapshot without a second formula', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #1, matching the snapshot', () => {
    expect(result.ranking.virtualPosition).toBe(1);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: -80.51, ranking #9, current factor 1.3', () => {
    expect(result.fte.currentNetFte).toBe(-80.51);
    expect(result.fte.netFteRanking).toBe(9);
    expect(result.fte.currentFteFactor).toBe(1.3);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is -22.80, gap is computed centrally to 57.71 FTE', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(-22.8);
    expect(result.fte.fteMilestones).toContainEqual({ position: 1, team: 'Middelburg', gapFte: 57.71 });
  });

  it('FTE milestones cover the reference positions from the snapshot, team names carried through', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 8, team: 'Alkmaar', gapFte: 23.36 },
      { position: 5, team: 'Utrecht', gapFte: 41.11 },
      { position: 3, team: 'Eindhoven', gapFte: 54.81 },
      { position: 1, team: 'Middelburg', gapFte: 57.71 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Virtual Final Score are carried through, distinct from Base League Points', () => {
    expect(result.powerBi.vcdbScore).toBe(16141.51);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(20983.97);
  });

  it('Virtual Top 3 is carried through unchanged', () => {
    expect(result.powerBi.topThree).toEqual(MANUAL_POWER_BI_SNAPSHOT.topThree);
  });

  it('snapshot timestamp (a reliable refresh time this time) is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-09-17T05:28:00+02:00');
    expect(result.powerBi.updatedAt).toBe('2026-09-17T05:28:00+02:00');
  });
});
