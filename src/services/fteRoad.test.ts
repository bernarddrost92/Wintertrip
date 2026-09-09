import { describe, expect, it } from 'vitest';
import { calculateFteGap, calculateFteGapToBenchmark, calculateFteMilestones, calculateFteProgress } from './fteRoad';

describe('calculateFteGap', () => {
  it('target 30, projected 27.5 -> gap 2.5', () => {
    const outcome = calculateFteGap(30, 27.5);
    expect(outcome).toEqual({ kind: 'gap', amount: 2.5 });
  });

  it('target 30, projected 30 -> secured, no buffer', () => {
    const outcome = calculateFteGap(30, 30);
    expect(outcome).toEqual({ kind: 'secured', buffer: 0 });
  });

  it('target 30, projected 31.2 -> secured + 1.2 buffer', () => {
    const outcome = calculateFteGap(30, 31.2);
    expect(outcome).toEqual({ kind: 'secured', buffer: 1.2 });
  });

  it('target null -> awaiting target, regardless of projected', () => {
    expect(calculateFteGap(null, 27.5)).toEqual({ kind: 'awaiting-target' });
    expect(calculateFteGap(null, null)).toEqual({ kind: 'awaiting-target' });
  });

  it('projected null (target known) -> awaiting projection, never a fabricated gap', () => {
    expect(calculateFteGap(30, null)).toEqual({ kind: 'awaiting-projection' });
  });
});

describe('calculateFteProgress', () => {
  it('computes a clamped percentage from projected/target', () => {
    const progress = calculateFteProgress(24.8, 28);
    expect(progress).not.toBeNull();
    expect(progress!.percent).toBeCloseTo((24.8 / 28) * 100, 5);
    expect(progress!.overTarget).toBe(0);
  });

  it('clamps the visual percentage at 100 when target is exceeded, but reports the real overage', () => {
    const progress = calculateFteProgress(29.2, 28);
    expect(progress).not.toBeNull();
    expect(progress!.percent).toBe(100);
    expect(progress!.overTarget).toBeCloseTo(1.2, 5);
  });

  it('never goes below 0', () => {
    const progress = calculateFteProgress(-5, 28);
    expect(progress!.percent).toBe(0);
  });

  it('returns null when projected is missing', () => {
    expect(calculateFteProgress(null, 28)).toBeNull();
  });

  it('returns null when target is missing or non-positive', () => {
    expect(calculateFteProgress(24.8, null)).toBeNull();
    expect(calculateFteProgress(24.8, 0)).toBeNull();
  });
});

describe('calculateFteGapToBenchmark', () => {
  it('current -79.01, current #1 benchmark -23.60 -> gap 55.41', () => {
    expect(calculateFteGapToBenchmark(-79.01, -23.6)).toBe(55.41);
  });

  it('returns null when the current Net FTE is missing', () => {
    expect(calculateFteGapToBenchmark(null, -23.6)).toBeNull();
  });

  it('returns null when the benchmark is missing — never a fabricated gap', () => {
    expect(calculateFteGapToBenchmark(-79.01, null)).toBeNull();
  });
});

describe('calculateFteMilestones', () => {
  it('computes the improvement needed to each reference position from the current Net FTE, carrying the team name through unchanged', () => {
    const milestones = calculateFteMilestones(-79.01, [
      { position: 8, team: 'Alkmaar', netFte: -55.85 },
      { position: 5, team: 'Utrecht', netFte: -39.7 },
      { position: 3, team: 'Breda', netFte: -25.83 },
      { position: 1, team: 'Middelburg', netFte: -23.6 },
    ]);
    expect(milestones).toEqual([
      { position: 8, team: 'Alkmaar', gapFte: 23.16 },
      { position: 5, team: 'Utrecht', gapFte: 39.31 },
      { position: 3, team: 'Breda', gapFte: 53.18 },
      { position: 1, team: 'Middelburg', gapFte: 55.41 },
    ]);
  });

  it('returns an empty list when the current Net FTE is missing — never a fabricated milestone', () => {
    expect(calculateFteMilestones(null, [{ position: 1, team: 'Middelburg', netFte: -23.6 }])).toEqual([]);
  });
});
