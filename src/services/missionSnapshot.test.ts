import { describe, expect, it } from 'vitest';
import { getMissionSnapshot } from './missionSnapshot';
import { MANUAL_POWER_BI_SNAPSHOT } from '../data/manualPowerBiSnapshot';

describe('getMissionSnapshot — maps the manual Power BI snapshot without a second formula', () => {
  const result = getMissionSnapshot();

  it('Virtual Position: #1, matching the snapshot', () => {
    expect(result.ranking.virtualPosition).toBe(1);
    expect(result.ranking.snapshotUpdatedAt).toBe(MANUAL_POWER_BI_SNAPSHOT.updatedAt);
  });

  it('Net FTE: -79.61, ranking #9, current factor 1.3', () => {
    expect(result.fte.currentNetFte).toBe(-79.61);
    expect(result.fte.netFteRanking).toBe(9);
    expect(result.fte.currentFteFactor).toBe(1.3);
  });

  it('no fixed FTE target is fabricated from the benchmark', () => {
    expect(result.fte.targetFteOnJan31).toBeNull();
  });

  it('current #1 benchmark is -22.40, gap is computed centrally to 57.21 FTE', () => {
    expect(result.fte.currentNumberOneBenchmark).toBe(-22.4);
    expect(result.fte.fteMilestones).toContainEqual({ position: 1, team: 'Middelburg', gapFte: 57.21 });
  });

  it('FTE milestones cover the reference positions from the snapshot, team names carried through', () => {
    expect(result.fte.fteMilestones).toEqual([
      { position: 8, team: 'Alkmaar', gapFte: 23.26 },
      { position: 5, team: 'Utrecht', gapFte: 40.21 },
      { position: 3, team: 'Eindhoven', gapFte: 53.91 },
      { position: 1, team: 'Middelburg', gapFte: 57.21 },
    ]);
  });

  it('VCDB score/ranking and the Power BI Virtual Final Score are carried through, distinct from Base League Points', () => {
    expect(result.powerBi.vcdbScore).toBe(14679.72);
    expect(result.powerBi.vcdbRanking).toBe(1);
    expect(result.powerBi.finalScore).toBe(19083.64);
  });

  it('Virtual Top 3 is carried through unchanged', () => {
    expect(result.powerBi.topThree).toEqual(MANUAL_POWER_BI_SNAPSHOT.topThree);
  });

  it('snapshot timestamp (date-only — no reliable refresh time in the screenshot) is shared across ranking, FTE, and Power BI sections', () => {
    expect(result.fte.snapshotUpdatedAt).toBe('2026-09-14');
    expect(result.powerBi.updatedAt).toBe('2026-09-14');
  });
});
