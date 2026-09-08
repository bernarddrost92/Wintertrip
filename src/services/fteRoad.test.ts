import { describe, expect, it } from 'vitest';
import { calculateFteGap, calculateFteProgress } from './fteRoad';

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
