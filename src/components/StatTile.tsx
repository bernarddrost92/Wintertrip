import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'ink' | 'gold' | 'intel';
}

const VALUE_TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  ink: 'text-ink',
  gold: 'text-gold',
  intel: 'text-intel',
};

/** One KPI: a small label, a big number, an optional one-line context. */
export function StatTile({ label, value, sub, tone = 'ink' }: StatTileProps) {
  return (
    <div className="bg-mission-panel px-4 py-4 sm:px-5">
      <p className="label-classified">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums leading-tight sm:text-3xl ${VALUE_TONE[tone]}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}
