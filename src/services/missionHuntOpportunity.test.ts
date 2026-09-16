import { describe, expect, it } from 'vitest';
import { classifyPlacement } from './missionHuntClassification';
import { badgesForClassification, DOUBLE_BADGE, GREY_BADGE, placementMatchesFilter, TIMING_BADGE, VERLENG_BADGE } from './missionHuntOpportunity';

describe('placementMatchesFilter', () => {
  const double = classifyPlacement('2026-10-01', '2026-12-31');
  const verlengOnly = classifyPlacement('2026-06-01', '2026-12-31');
  const timingOnly = classifyPlacement('2026-10-01', '2028-06-30');
  const grey = classifyPlacement('2026-06-01', '2028-06-30');

  it('all-placements matches everything', () => {
    expect(placementMatchesFilter(grey, 'all-placements')).toBe(true);
  });

  it('all-opportunities matches everything except grey', () => {
    expect(placementMatchesFilter(double, 'all-opportunities')).toBe(true);
    expect(placementMatchesFilter(grey, 'all-opportunities')).toBe(false);
  });

  it('double only matches double', () => {
    expect(placementMatchesFilter(double, 'double')).toBe(true);
    expect(placementMatchesFilter(verlengOnly, 'double')).toBe(false);
    expect(placementMatchesFilter(timingOnly, 'double')).toBe(false);
  });

  it('verleng matches both verleng-only and double', () => {
    expect(placementMatchesFilter(verlengOnly, 'verleng')).toBe(true);
    expect(placementMatchesFilter(double, 'verleng')).toBe(true);
    expect(placementMatchesFilter(timingOnly, 'verleng')).toBe(false);
  });

  it('timing matches both timing-only and double', () => {
    expect(placementMatchesFilter(timingOnly, 'timing')).toBe(true);
    expect(placementMatchesFilter(double, 'timing')).toBe(true);
    expect(placementMatchesFilter(verlengOnly, 'timing')).toBe(false);
  });

  it('grey only matches grey', () => {
    expect(placementMatchesFilter(grey, 'grey')).toBe(true);
    expect(placementMatchesFilter(double, 'grey')).toBe(false);
  });
});

describe('badgesForClassification', () => {
  it('a double placement gets timing + verleng + double badges', () => {
    const classification = classifyPlacement('2026-10-01', '2026-12-31');
    expect(badgesForClassification(classification)).toEqual([TIMING_BADGE, VERLENG_BADGE, DOUBLE_BADGE]);
  });

  it('a grey placement gets exactly the grey badge', () => {
    const classification = classifyPlacement('2026-06-01', '2028-06-30');
    expect(badgesForClassification(classification)).toEqual([GREY_BADGE]);
  });
});
