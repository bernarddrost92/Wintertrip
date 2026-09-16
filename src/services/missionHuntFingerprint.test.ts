import { describe, expect, it } from 'vitest';
import { buildPlacementFingerprint } from './missionHuntFingerprint';

describe('buildPlacementFingerprint', () => {
  it('is stable for identical inputs', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    expect(a).toBe(b);
  });

  it('is case- and whitespace-insensitive on email/professional/client (a re-typed duplicate still matches)', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('Bernard.Drost@Maandag.com', '  ryan dijkstra  ', 'GREIJDANUS', '2026-10-01', '2026-12-31');
    expect(a).toBe(b);
  });

  it('differs across owner emails for the same professional/client/dates', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('lisa@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    expect(a).not.toBe(b);
  });

  it('differs when the professional differs', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('bernard.drost@maandag.com', 'Someone Else', 'Greijdanus', '2026-10-01', '2026-12-31');
    expect(a).not.toBe(b);
  });

  it('differs when the client differs', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Andere Klant', '2026-10-01', '2026-12-31');
    expect(a).not.toBe(b);
  });

  it('differs when the start date differs', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-11-01', '2026-12-31');
    expect(a).not.toBe(b);
  });

  it('differs when the end date differs', () => {
    const a = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2026-12-31');
    const b = buildPlacementFingerprint('bernard.drost@maandag.com', 'Ryan Dijkstra', 'Greijdanus', '2026-10-01', '2027-01-15');
    expect(a).not.toBe(b);
  });
});
