const NL_INTEGER = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const NL_DECIMAL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
/** Presentation-only rounding to 2 decimals, trimmed to a bare integer when exact (1.000 not 1.000,00). */
const NL_SCORE = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
/** Always exactly 2 decimals — used for the transparent per-month VCDB math. */
const NL_FIXED2 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function formatPoints(value: number): string {
  return NL_INTEGER.format(Math.round(value));
}

export function formatSignedPoints(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±';
  return `${sign}${NL_INTEGER.format(Math.abs(rounded))}`;
}

export function formatFactor(value: number): string {
  return `${NL_DECIMAL.format(value)}x`;
}

export function formatHours(value: number): string {
  return `${NL_DECIMAL.format(value)} u/w`;
}

/** Mission Value / Base Score / Factor Bonus: up to 2 decimals, no forced trailing zeros. */
export function formatScore(value: number): string {
  return NL_SCORE.format(Math.round(value * 100) / 100);
}

export function formatSignedScore(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±';
  return `${sign}${NL_SCORE.format(Math.abs(rounded))}`;
}

/** Fixed 2-decimal VCDB value, as used throughout the Show Calculation breakdown. */
export function formatVcdbValue(value: number): string {
  return NL_FIXED2.format(value);
}

export function formatPercent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}
