import { describe, expect, it } from 'vitest';
import { calculateFoundPoints } from './missionReceipt';

describe('calculateFoundPoints — League Check found points, strictly separated from Factor', () => {
  it('the worked example from spec: base 40->60 at factor 2.5 finds +20 base / +50 league points', () => {
    const found = calculateFoundPoints(40, 60, 2.5);
    expect(found.foundBasePoints).toBe(20);
    expect(found.foundLeaguePoints).toBe(50);
  });

  it('a Factor change alone (base score identical) finds exactly 0 points, at any factor', () => {
    expect(calculateFoundPoints(80, 80, 1.0).foundLeaguePoints).toBe(0);
    expect(calculateFoundPoints(80, 80, 2.5).foundLeaguePoints).toBe(0);
    expect(calculateFoundPoints(80, 80, 2.5).foundBasePoints).toBe(0);
  });

  it('NO CHANGE (identical before/after) is a fully valid outcome: +0.00 found', () => {
    const found = calculateFoundPoints(61.29, 61.29, 2.5);
    expect(found.foundBasePoints).toBe(0);
    expect(found.foundLeaguePoints).toBe(0);
  });

  it('a real base-score improvement multiplies by the selected factor', () => {
    // 29 jan - 1 aug worked example: before base 40, after base 61.29, factor 2.5.
    const found = calculateFoundPoints(40, 61.29, 2.5);
    expect(found.foundBasePoints).toBeCloseTo(21.29, 6);
    expect(found.foundLeaguePoints).toBeCloseTo(53.225, 6);
  });

  it('a base score that goes down finds negative points rather than being clamped to zero', () => {
    const found = calculateFoundPoints(80, 60, 2.0);
    expect(found.foundBasePoints).toBe(-20);
    expect(found.foundLeaguePoints).toBe(-40);
  });
});
