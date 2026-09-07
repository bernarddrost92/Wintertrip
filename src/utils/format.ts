const NL_INTEGER = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const NL_DECIMAL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1, minimumFractionDigits: 0 });

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
