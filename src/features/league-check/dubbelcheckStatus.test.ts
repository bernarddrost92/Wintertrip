import { describe, expect, it } from 'vitest';
import { getDubbelcheckState } from './dubbelcheckStatus';

describe('getDubbelcheckState', () => {
  it('F. a non-zero found points figure reads as "found"', () => {
    expect(getDubbelcheckState(44.47)).toEqual({ kind: 'found', points: 44.47 });
    expect(getDubbelcheckState(-3.2)).toEqual({ kind: 'found', points: -3.2 });
  });

  it('G. an exact zero reads as "none-recorded", never a fabricated 0', () => {
    expect(getDubbelcheckState(0)).toEqual({ kind: 'none-recorded' });
  });

  it('treats a rounding-noise value as zero too (0.001 rounds to 0.00)', () => {
    expect(getDubbelcheckState(0.001)).toEqual({ kind: 'none-recorded' });
  });

  it('H. null (no Calculator session) reads as "not-calculated"', () => {
    expect(getDubbelcheckState(null)).toEqual({ kind: 'not-calculated' });
  });
});
