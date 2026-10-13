const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Always rendered in Europe/Amsterdam — the team's own timezone, not the
 * viewer's — so a snapshot time reads the same for everyone. A date-only
 * snapshot (no reliable Power BI refresh time in the screenshot) renders
 * as just the date, never a fabricated time.
 */
export function formatPowerBiTime(isoDateOrDateOnly: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateOrDateOnly);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day} ${MONTH_ABBR[Number(month) - 1]} ${year}`;
  }
  const date = new Date(isoDateOrDateOnly);
  if (Number.isNaN(date.getTime())) return '—';
  const zone = 'Europe/Amsterdam';
  const day = date.toLocaleString('en-GB', { day: '2-digit', timeZone: zone });
  const month = date.toLocaleString('en-GB', { month: 'short', timeZone: zone }).slice(0, 3).toUpperCase();
  const year = date.toLocaleString('en-GB', { year: 'numeric', timeZone: zone });
  const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone });
  return `${day} ${month} ${year} · ${time}`;
}
