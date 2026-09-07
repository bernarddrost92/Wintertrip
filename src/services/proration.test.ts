import { describe, expect, it } from 'vitest';
import {
  calculateCalendarMonthFraction,
  calculateLeagueExposureBreakdown,
  calculateQualifyingTermBreakdown,
  calculateQualifyingTermValue,
  calculateTotalLeagueExposure,
  getDaysInMonth,
  getInclusiveOverlapDays,
} from './proration';

describe('getDaysInMonth (TEST 4 — calendar differences, TEST 9 — leap-safe)', () => {
  it('knows September has 30 days', () => {
    expect(getDaysInMonth(2026, 9)).toBe(30);
  });
  it('knows January has 31 days', () => {
    expect(getDaysInMonth(2027, 1)).toBe(31);
  });
  it('knows February 2027 (non-leap) has 28 days', () => {
    expect(getDaysInMonth(2027, 2)).toBe(28);
  });
  it('knows February 2028 (leap year) has 29 days', () => {
    expect(getDaysInMonth(2028, 2)).toBe(29);
  });
});

describe('getInclusiveOverlapDays (TEST 7 — one-day overlap, TEST 8 — month-end)', () => {
  it('counts a single-day range as exactly 1 overlapping day with itself, never 0', () => {
    expect(getInclusiveOverlapDays('2026-09-15', '2026-09-15', '2026-09-15', '2026-09-15')).toBe(1);
  });

  it('handles a range spanning a month boundary without an off-by-one gap', () => {
    // Placement 30 Sep -> 1 Oct: exactly 1 day active in each month, no day lost or doubled.
    const sep = calculateCalendarMonthFraction('2026-09-30', '2026-10-01', 2026, 9);
    const oct = calculateCalendarMonthFraction('2026-09-30', '2026-10-01', 2026, 10);
    expect(sep.overlapDays).toBe(1);
    expect(oct.overlapDays).toBe(1);
  });

  it('returns 0 for non-overlapping ranges', () => {
    expect(getInclusiveOverlapDays('2026-09-01', '2026-09-10', '2026-10-01', '2026-10-05')).toBe(0);
  });
});

describe('calculateCalendarMonthFraction (TEST 3 — partial September)', () => {
  it('gives 16/30 exposure for a placement starting 15 September (inclusive-day rule)', () => {
    const segment = calculateCalendarMonthFraction('2026-09-15', '2027-03-05', 2026, 9);
    expect(segment.daysInMonth).toBe(30);
    expect(segment.overlapDays).toBe(16);
    expect(segment.fraction).toBeCloseTo(16 / 30, 10);
  });
});

describe('calculateQualifyingTermBreakdown (TEST 1 — official example, TEST 5 — arbitrary placement)', () => {
  it('reproduces the official 8-month / VCDB-10 example: term value 80', () => {
    const breakdown = calculateQualifyingTermBreakdown('2026-09-01', '2027-04-30', 10);
    expect(breakdown.segments).toHaveLength(8);
    expect(breakdown.segments.every((s) => s.fraction === 1)).toBe(true);
    expect(breakdown.totalValue).toBe(80);
  });

  it('prorates every partial and full month of an arbitrary 15 Sep – 5 Mar placement', () => {
    const breakdown = calculateQualifyingTermBreakdown('2026-09-15', '2027-03-05', 10);
    const byMonth = Object.fromEntries(breakdown.segments.map((s) => [s.monthKey, s]));

    expect(byMonth['2026-09'].overlapDays).toBe(16);
    expect(byMonth['2026-09'].value).toBeCloseTo((16 / 30) * 10, 10);

    expect(byMonth['2026-10'].fraction).toBe(1);
    expect(byMonth['2026-11'].fraction).toBe(1);
    expect(byMonth['2026-12'].fraction).toBe(1);
    expect(byMonth['2027-01'].fraction).toBe(1);
    expect(byMonth['2027-02'].fraction).toBe(1); // Feb 2027 full (28/28)

    expect(byMonth['2027-03'].overlapDays).toBe(5);
    expect(byMonth['2027-03'].daysInMonth).toBe(31);
    expect(byMonth['2027-03'].value).toBeCloseTo((5 / 31) * 10, 10);

    // 16/30*10 + 5*10 + 5/31*10  (Oct,Nov,Dec,Jan,Feb full = 5 months)
    const expectedTotal = (16 / 30) * 10 + 5 * 10 + (5 / 31) * 10;
    expect(breakdown.totalValue).toBeCloseTo(expectedTotal, 10);
    expect(breakdown.totalValue).toBeCloseTo(56.9462, 3);
  });

  it('never rounds intermediate month values — full precision is kept until presentation', () => {
    const value = calculateQualifyingTermValue('2026-09-15', '2026-09-15', 10);
    expect(value).toBeCloseTo((1 / 30) * 10, 12);
  });
});

describe('calculateLeagueExposureBreakdown (TEST 6, TEST 15, TEST 16)', () => {
  it('gives partial Sep, full Oct-Jan, and excludes Feb/Mar entirely for the arbitrary placement', () => {
    const breakdown = calculateLeagueExposureBreakdown('2026-09-15', '2027-03-05');
    const byMonth = Object.fromEntries(breakdown.segments.map((s) => [s.monthKey, s]));

    expect(byMonth['2026-09'].fraction).toBeCloseTo(16 / 30, 10);
    expect(byMonth['2026-10'].fraction).toBe(1);
    expect(byMonth['2026-11'].fraction).toBe(1);
    expect(byMonth['2026-12'].fraction).toBe(1);
    expect(byMonth['2027-01'].fraction).toBe(1);
    // Only the 5 league months (Sep-Jan) exist in this breakdown at all — Feb/Mar are structurally excluded.
    expect(breakdown.segments.map((s) => s.monthKey)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01']);

    const expectedExposure = 16 / 30 + 4;
    expect(breakdown.totalExposure).toBeCloseTo(expectedExposure, 10);
    expect(breakdown.totalExposure).toBeCloseTo(4.5333, 3);
  });

  it('TEST 15 — a placement starting after the league ends has zero exposure', () => {
    expect(calculateTotalLeagueExposure('2027-03-01', '2027-06-30')).toBe(0);
  });

  it('TEST 16 — a placement ending before the league begins has zero exposure', () => {
    expect(calculateTotalLeagueExposure('2025-01-01', '2026-08-31')).toBe(0);
  });
});
