import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — maps the manual Power BI snapshot without a second formula', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #1, matching the snapshot', () => {
    expect(result.ranking.virtualPosition).toBe(1);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: -79.01, ranking #9, current factor 1.3', () => {
    expect(result.fte.currentNetFte).toBe(-79.01);
    expect(result.fte.netFteRanking).toBe(9);
    expect(result.fte.currentFteFactor).toBe(1.3);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is -23.40, gap is computed centrally to 55.61 FTE', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(-23.4);
    expect(result.fte.fteMilestones).toContainEqual({ position: 1, team: 'Middelburg', gapFte: 55.61 });
  });

  it('FTE milestones cover the reference positions from the snapshot, team names carried through', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 8, team: 'Alkmaar', gapFte: 22.66 },
      { position: 5, team: 'Utrecht', gapFte: 39.61 },
      { position: 3, team: 'Breda', gapFte: 53.68 },
      { position: 1, team: 'Middelburg', gapFte: 55.61 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Virtual Final Score are carried through, distinct from Base League Points', () => {
    expect(result.powerBi.vcdbScore).toBe(13869.25);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(18030.03);
  });

  it('Virtual Top 3 is carried through unchanged', () => {
    expect(result.powerBi.topThree).toEqual(MANUAL_POWER_BI_SNAPSHOT.topThree);
  });

  it('snapshot timestamp is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-09-11T05:19:00+02:00');
    expect(result.powerBi.updatedAt).toBe('2026-09-11T05:19:00+02:00');
  });
});
