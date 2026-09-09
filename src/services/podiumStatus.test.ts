import { describe, expect, it } from 'vitest';
import { calculateScoreLead, getPodiumState } from './podiumStatus';

describe('getPodiumState', () => {
  it('virtualPosition = 1 -> gold state', () => {
    expect(getPodiumState(1)).toBe('gold');
  });

  it('virtualPosition = 2 -> silver state', () => {
    expect(getPodiumState(2)).toBe('silver');
  });

  it('virtualPosition = 3 -> bronze state', () => {
    expect(getPodiumState(3)).toBe('bronze');
  });

  it('virtualPosition = 4 -> default state', () => {
    expect(getPodiumState(4)).toBe('default');
  });

  it('a position further down the ranking also reads as the default state', () => {
    expect(getPodiumState(9)).toBe('default');
  });

  it('virtualPosition = null -> awaiting intelligence', () => {
    expect(getPodiumState(null)).toBe('awaiting');
  });
});

describe('calculateScoreLead', () => {
  it('16646.21 vs 12708.85 -> lead of 3937.36', () => {
    expect(calculateScoreLead(16646.21, 12708.85)).toBe(3937.36);
  });

  it('returns null when the leader score is missing', () => {
    expect(calculateScoreLead(null, 12708.85)).toBeNull();
  });

  it('returns null when the other score is missing', () => {
    expect(calculateScoreLead(16646.21, null)).toBeNull();
  });
});
