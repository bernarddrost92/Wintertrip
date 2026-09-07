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

/**
 * Whole-day epoch index (days since the Unix epoch) computed from UTC
 * calendar components. Never touches the local timezone or wall-clock time,
 * so date-only arithmetic (day counts, overlaps) is always exact.
 */
export function toEpochDay(iso: IsoDate): number {
  const { year, month, day } = parseIsoDate(iso);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}
