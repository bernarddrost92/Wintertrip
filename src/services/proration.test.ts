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

describe('Explicit day-value worked examples (VCDB is a monthly value, never a flat /30)', () => {
  it('September: 15 t/m 30 sep = 16 active days of 30, dagwaarde 10/30, prorated 16 × 10/30', () => {
    const segment = calculateCalendarMonthFraction('2026-09-15', '2026-09-30', 2026, 9);
    expect(segment.daysInMonth).toBe(30);
    expect(segment.overlapDays).toBe(16);
    const dagwaarde = 10 / 30;
    expect(calculateQualifyingTermValue('2026-09-15', '2026-09-30', 10)).toBeCloseTo(16 * dagwaarde, 10);
  });

  it('January: 27 t/m 31 januari = 5 active days of 31, dagwaarde 10/31, prorated 5 × 10/31', () => {
    const segment = calculateCalendarMonthFraction('2027-01-27', '2027-01-31', 2027, 1);
    expect(segment.daysInMonth).toBe(31);
    expect(segment.overlapDays).toBe(5);
    const dagwaarde = 10 / 31;
    expect(calculateQualifyingTermValue('2027-01-27', '2027-01-31', 10)).toBeCloseTo(5 * dagwaarde, 10);
  });

  it('February 2027: 1 t/m 14 februari = 14 active days of 28, dagwaarde 10/28, prorated 14 × 10/28 = 5', () => {
    const segment = calculateCalendarMonthFraction('2027-02-01', '2027-02-14', 2027, 2);
    expect(segment.daysInMonth).toBe(28);
    expect(segment.overlapDays).toBe(14);
    expect(calculateQualifyingTermValue('2027-02-01', '2027-02-14', 10)).toBeCloseTo(5, 10);
  });

  it('April: a full April (30 days) prorates to the entire monthly VCDB, no rounding applied', () => {
    const segment = calculateCalendarMonthFraction('2027-04-01', '2027-04-30', 2027, 4);
    expect(segment.daysInMonth).toBe(30);
    expect(segment.overlapDays).toBe(30);
    expect(segment.fraction).toBe(1);
    expect(calculateQualifyingTermValue('2027-04-01', '2027-04-30', 10)).toBe(10);
  });

  it('multi-month contract: each touched month uses its own real day count, never a uniform /30', () => {
    // 15 Sep 2026 -> 14 Feb 2027: partial Sep (16/30), full Okt/Nov/Dec/Jan, partial Feb (14/28).
    const breakdown = calculateQualifyingTermBreakdown('2026-09-15', '2027-02-14', 10);
    const byMonth = Object.fromEntries(breakdown.segments.map((s) => [s.monthKey, s]));

    expect(byMonth['2026-09'].daysInMonth).toBe(30);
    expect(byMonth['2026-09'].overlapDays).toBe(16);
    expect(byMonth['2026-10'].daysInMonth).toBe(31);
    expect(byMonth['2026-10'].fraction).toBe(1);
    expect(byMonth['2026-11'].daysInMonth).toBe(30);
    expect(byMonth['2026-11'].fraction).toBe(1);
    expect(byMonth['2026-12'].daysInMonth).toBe(31);
    expect(byMonth['2026-12'].fraction).toBe(1);
    expect(byMonth['2027-01'].daysInMonth).toBe(31);
    expect(byMonth['2027-01'].fraction).toBe(1);
    expect(byMonth['2027-02'].daysInMonth).toBe(28);
    expect(byMonth['2027-02'].overlapDays).toBe(14);

    const expectedTotal = (16 / 30) * 10 + 10 + 10 + 10 + 10 + (14 / 28) * 10;
    expect(breakdown.totalValue).toBeCloseTo(expectedTotal, 10);
  });
});
