/**
 * Google Sheets-sourced numeric fields can arrive as Dutch-locale text
 * ("16,5") rather than a JSON number — the sanitized production feed is
 * expected to carry them as either. This is the one place that parses
 * them, so every consumer sees a clean `number | null` and never has to
 * guess at comma-vs-dot itself.
 */
export function parseDutchNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  // Dutch formatting: "." as thousands separator, "," as the decimal point.
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
