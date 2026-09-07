import { LEAGUE_MONTHS } from '../../config/leagueRules';
import type { ScoreResult } from '../../types/scoring';
import { formatPercent } from '../../utils/format';

interface MonthlyIntelligenceProps {
  result: ScoreResult | null;
}

export function MonthlyIntelligence({ result }: MonthlyIntelligenceProps) {
  const segments = result?.leagueExposure.segments ?? LEAGUE_MONTHS.map((m) => ({
    monthKey: `${m.year}-${m.month}`,
    label: m.label,
    daysInMonth: 0,
    overlapDays: 0,
    fraction: 0,
  }));

  return (
    <div className="panel">
      <header className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
        <h2 className="label-classified text-ink">Monthly Intelligence — League Timeline</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">01 Sep 2026 – 31 Jan 2027</span>
      </header>
      <div className="grid grid-cols-2 divide-gold/10 sm:grid-cols-5 sm:divide-x">
        {segments.map((s) => {
          const status = s.fraction >= 1 ? 'FULL' : s.fraction > 0 ? 'PARTIAL' : '—';
          return (
            <div key={s.monthKey} className="border-b border-gold/10 px-4 py-4 sm:border-b-0">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-bold tracking-wide text-ink">{s.label}</span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider ${
                    status === 'FULL' ? 'text-gold' : status === 'PARTIAL' ? 'text-gold/70' : 'text-ink-dim'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-gold">{formatPercent(s.fraction, 1)}</p>
              <div className="mt-2 h-1 w-full bg-white/[0.06]">
                <div
                  className={`h-full transition-[width] duration-500 ${s.fraction > 0 && s.fraction < 1 ? 'bg-[repeating-linear-gradient(45deg,#E3B23C_0,#E3B23C_4px,transparent_4px,transparent_8px)]' : 'bg-gold-sweep'}`}
                  style={{ width: `${Math.min(100, s.fraction * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-ink-muted">
                {s.daysInMonth > 0 ? `${s.overlapDays} / ${s.daysInMonth} DAYS` : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
