import type { IsoDate } from '../types/league';

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Parses "YYYY-MM-DD" into plain integer components — never touches Date/TZ. */
export function parseIsoDate(iso: IsoDate): CalendarDate {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

/** Absolute month index (year*12 + month) — the unit month-arithmetic is done in. */
function monthIndex(d: CalendarDate): number {
  return d.year * 12 + (d.month - 1);
}

export function isValidIsoDate(iso: string | undefined | null): iso is IsoDate {
  if (!iso) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const { month, day } = parseIsoDate(iso);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  return true;
}

export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return compareIsoDates(a, b) >= 0 ? a : b;
}

export function minIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return compareIsoDates(a, b) <= 0 ? a : b;
}

/**
 * Whole-month duration between two inclusive dates. The end month counts as
 * a full month once the end day reaches (or passes) the start day, mirroring
 * how the business talks about a placement's "looptijd in maanden"
 * (e.g. 2026-09-01 → 2027-04-30 is treated as 8 months).
 */
export function calculateDurationMonths(start: IsoDate, end: IsoDate): number {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return 0;
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (monthIndex(e) < monthIndex(s)) return 0;
  const months = monthIndex(e) - monthIndex(s) + (e.day >= s.day ? 1 : 0);
  return Math.max(0, months);
}

/**
 * Adds N whole calendar months to an ISO date, clamping the day into the
 * target month (used only by scenario/preview helpers, never by stored data).
 */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const { year, month, day } = parseIsoDate(iso);
  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(day, daysInTargetMonth);
  return `${String(targetYear).padStart(4, '0')}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

/**
 * Number of calendar months a [start, end] range overlaps with a given
 * league period, counted inclusively (e.g. Sep–Jan = 5). Returns 0 when
 * there is no overlap.
 */
export function calculateLeagueMonths(
  start: IsoDate,
  end: IsoDate,
  leagueStart: IsoDate,
  leagueEnd: IsoDate,
): number {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return 0;
  if (compareIsoDates(end, start) < 0) return 0;

  const overlapStart = maxIsoDate(start, leagueStart);
  const overlapEnd = minIsoDate(end, leagueEnd);
  if (compareIsoDates(overlapEnd, overlapStart) < 0) return 0;

  const s = parseIsoDate(overlapStart);
  const e = parseIsoDate(overlapEnd);
  return monthIndex(e) - monthIndex(s) + 1;
}

/** Absolute month indices (year*12+month-1) of every calendar month in [start, end], inclusive. */
export function monthIndexRange(start: IsoDate, end: IsoDate): number[] {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return [];
  const s = monthIndex(parseIsoDate(start));
  const e = monthIndex(parseIsoDate(end));
  if (e < s) return [];
  return Array.from({ length: e - s + 1 }, (_, i) => s + i);
}

/** Month indices where [start, end] overlaps [leagueStart, leagueEnd]. */
export function activeLeagueMonthIndices(
  start: IsoDate,
  end: IsoDate,
  leagueStart: IsoDate,
  leagueEnd: IsoDate,
): number[] {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return [];
  const overlapStart = maxIsoDate(start, leagueStart);
  const overlapEnd = minIsoDate(end, leagueEnd);
  return monthIndexRange(overlapStart, overlapEnd);
}

const MONTH_NAMES_NL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function formatIsoDateNl(iso: IsoDate): string {
  if (!isValidIsoDate(iso)) return '—';
  const { year, month, day } = parseIsoDate(iso);
  return `${day} ${MONTH_NAMES_NL[month - 1]} ${year}`;
}

export function isoDateToday(): IsoDate {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
