import { describe, expect, it } from 'vitest';
import { HUNT_MISSIONS, HUNT_ONE_LINERS, pickDifferent } from './huntLines';

describe('Hunt Mode copy', () => {
  it('has 25–30 one-liners and 15–20 missions, all non-empty and unique', () => {
    expect(HUNT_ONE_LINERS.length).toBeGreaterThanOrEqual(25);
    expect(HUNT_ONE_LINERS.length).toBeLessThanOrEqual(30);
    expect(HUNT_MISSIONS.length).toBeGreaterThanOrEqual(15);
    expect(HUNT_MISSIONS.length).toBeLessThanOrEqual(20);
    for (const list of [HUNT_ONE_LINERS, HUNT_MISSIONS]) {
      expect(new Set(list).size).toBe(list.length);
      list.forEach((item) => expect(item.trim().length).toBeGreaterThan(0));
    }
  });

  it('pickDifferent never returns the current item', () => {
    const current = HUNT_ONE_LINERS[3];
    for (const r of [0, 0.25, 0.5, 0.999]) {
      const next = pickDifferent(HUNT_ONE_LINERS, current, () => r);
      expect(next).not.toBe(current);
      expect(HUNT_ONE_LINERS).toContain(next);
    }
  });

  it('pickDifferent always yields a valid mission from the list', () => {
    let current: (typeof HUNT_MISSIONS)[number] | null = null;
    for (let i = 0; i < 50; i++) {
      current = pickDifferent(HUNT_MISSIONS, current);
      expect(HUNT_MISSIONS).toContain(current);
    }
  });
});
