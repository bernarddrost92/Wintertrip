import { describe, expect, it } from 'vitest';
import { getLatestMissionUpdate, getSortedMissionUpdates, getTransmissionLabel, type MissionUpdate } from './missionUpdates';

function update(overrides: Partial<MissionUpdate>): MissionUpdate {
  return {
    id: 'x',
    date: '2026-09-01',
    title: 'X',
    videoSrc: '/x.mp4',
    ...overrides,
  };
}

describe('getSortedMissionUpdates — newest date first, never array order', () => {
  it('sorts by date descending regardless of input order', () => {
    const list = [
      update({ id: 'a', date: '2026-09-01' }),
      update({ id: 'c', date: '2026-09-21' }),
      update({ id: 'b', date: '2026-09-14' }),
    ];
    expect(getSortedMissionUpdates(list).map((u) => u.id)).toEqual(['c', 'b', 'a']);
  });

  it('a single-item array sorts trivially', () => {
    const list = [update({ id: 'only' })];
    expect(getSortedMissionUpdates(list).map((u) => u.id)).toEqual(['only']);
  });
});

describe('getLatestMissionUpdate — the newest valid update, never array position', () => {
  it('returns the update with the newest date even when it is first in the array', () => {
    const list = [update({ id: 'newest', date: '2026-09-21' }), update({ id: 'older', date: '2026-09-01' })];
    expect(getLatestMissionUpdate(list)?.id).toBe('newest');
  });

  it('returns the update with the newest date even when it is last in the array', () => {
    const list = [update({ id: 'older', date: '2026-09-01' }), update({ id: 'newest', date: '2026-09-21' })];
    expect(getLatestMissionUpdate(list)?.id).toBe('newest');
  });

  it('returns null for an empty catalog rather than throwing', () => {
    expect(getLatestMissionUpdate([])).toBeNull();
  });
});

describe('getTransmissionLabel — numbered by chronological (oldest-first) position, not date-sorted display order', () => {
  it('labels the oldest update as TRANSMISSION 001', () => {
    const list = [update({ id: 'first', date: '2026-09-01' }), update({ id: 'second', date: '2026-09-21' })];
    expect(getTransmissionLabel(list[0], list)).toBe('TRANSMISSION 001');
    expect(getTransmissionLabel(list[1], list)).toBe('TRANSMISSION 002');
  });

  it("a new update's own number never renumbers an existing one", () => {
    const original = [update({ id: 'first', date: '2026-09-01' })];
    expect(getTransmissionLabel(original[0], original)).toBe('TRANSMISSION 001');

    const withNewer = [...original, update({ id: 'second', date: '2026-09-21' })];
    // "first" keeps its number even though a newer transmission was added.
    expect(getTransmissionLabel(original[0], withNewer)).toBe('TRANSMISSION 001');
  });
});
