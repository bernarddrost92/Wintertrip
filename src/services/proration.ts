/**
 * Calendar-day proration primitives — the only place that converts a date
 * range into fractional month coverage. Nothing above this module is
 * allowed to reach into date arithmetic directly.
 *
 * Inclusive-day convention: both the start date and the end date of a range
 * count as active days. A placement starting 15 September is active on the
 * 15th itself, so September has 30 − 15 + 1 = 16 active days out of 30
 * (fraction 16/30 ≈ 0.5333). This is the single rule every function below
 * relies on — documented once, here, rather than assumed silently at each
 * call site.
 *
 * All day counting happens as integer epoch-day arithmetic (see
 * utils/dates.ts#toEpochDay), so nothing here is sensitive to timezone or
 * daylight-saving shifts — it is pure date-only calendar math.
 */
import type { MonthSegment, QualifyingTermBreakdown, QualifyingTermSegment } from '../types/scoring';
import type { IsoDate } from '../types/league';
import { compareIsoDates, isValidIsoDate, parseIsoDate, toEpochDay } from '../utils/dates';

/** Number of days in a given calendar month (month is 1-12, leap years handled). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthBounds(year: number, month: number): { start: IsoDate; end: IsoDate; daysInMonth: number } {
  const daysInMonth = getDaysInMonth(year, month);
  return {
    start: `${year}-${pad2(month)}-01`,
    end: `${year}-${pad2(month)}-${pad2(daysInMonth)}`,
    daysInMonth,
  };
}

/**
 * Inclusive day-count overlap between two date ranges. Returns 0 when the
 * ranges don't touch. A range where start === end overlaps itself in
 * exactly 1 day (never 0) — there is no off-by-one gap at single-day ranges
 * or at month boundaries.
 */
export function getInclusiveOverlapDays(
  aStart: IsoDate,
  aEnd: IsoDate,
  bStart: IsoDate,
  bEnd: IsoDate,
): number {
  if (!isValidIsoDate(aStart) || !isValidIsoDate(aEnd) || !isValidIsoDate(bStart) || !isValidIsoDate(bEnd)) return 0;
  if (compareIsoDates(aEnd, aStart) < 0 || compareIsoDates(bEnd, bStart) < 0) return 0;

  const lo = Math.max(toEpochDay(aStart), toEpochDay(bStart));
  const hi = Math.min(toEpochDay(aEnd), toEpochDay(bEnd));
  return Math.max(0, hi - lo + 1);
}

/** How much of one specific calendar month a date range covers, as a day count and fraction. */
export function calculateCalendarMonthFraction(
  rangeStart: IsoDate,
  rangeEnd: IsoDate,
  year: number,
  month: number,
): MonthSegment {
  const { start, end, daysInMonth } = monthBounds(year, month);
  const overlapDays = getInclusiveOverlapDays(rangeStart, rangeEnd, start, end);
  return {
    monthKey: `${year}-${pad2(month)}`,
    year,
    month,
    label: MONTH_LABEL[month - 1],
    daysInMonth,
    overlapDays,
    fraction: daysInMonth > 0 ? overlapDays / daysInMonth : 0,
  };
}

const MONTH_LABEL = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

/** Every calendar month a date range touches, in order, inclusive on both ends. */
function calendarMonthsTouched(start: IsoDate, end: IsoDate): { year: number; month: number }[] {
  if (!isValidIsoDate(start) || !isValidIsoDate(end) || compareIsoDates(end, start) < 0) return [];
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  const startIndex = s.year * 12 + (s.month - 1);
  const endIndex = e.year * 12 + (e.month - 1);
  const months: { year: number; month: number }[] = [];
  for (let idx = startIndex; idx <= endIndex; idx += 1) {
    months.push({ year: Math.floor(idx / 12), month: (idx % 12) + 1 });
  }
  return months;
}

/**
 * Qualifying Term Value: the VCDB value represented by the *entire* deal
 * period (looptijd × VCDB), prorated per calendar month for any partial
 * start/end month. Full internal precision is kept — nothing is rounded
 * until presentation.
 */
export function calculateQualifyingTermBreakdown(
  start: IsoDate,
  end: IsoDate,
  vcdbPerMonth: number,
): QualifyingTermBreakdown {
  const months = calendarMonthsTouched(start, end);
  const safeVcdb = Number.isFinite(vcdbPerMonth) && vcdbPerMonth > 0 ? vcdbPerMonth : 0;

  const segments: QualifyingTermSegment[] = months.map(({ year, month }) => {
    const segment = calculateCalendarMonthFraction(start, end, year, month);
    return { ...segment, value: segment.fraction * safeVcdb };
  });

  return {
    segments,
    vcdbPerMonth: safeVcdb,
    totalValue: segments.reduce((sum, s) => sum + s.value, 0),
  };
}

export function calculateQualifyingTermValue(start: IsoDate, end: IsoDate, vcdbPerMonth: number): number {
  return calculateQualifyingTermBreakdown(start, end, vcdbPerMonth).totalValue;
}
