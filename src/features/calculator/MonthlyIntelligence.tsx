import { Fragment } from 'react';
import type { ScoreResult } from '../../types/scoring';
import { formatVcdbValue } from '../../utils/format';

interface MonthlyIntelligenceProps {
  result: ScoreResult | null;
}

/**
 * Shows every calendar month the QUALIFYING TERM itself actually touches —
 * not a fixed Sep–Jan window. An extension running to August shows Jan
 * through Aug; a placement running Sep–Apr shows all eight of those months.
 */
export function MonthlyIntelligence({ result }: MonthlyIntelligenceProps) {
  const segments = result?.qualifyingTerm.segments ?? [];
  const vcdbPerMonth = result?.qualifyingTerm.vcdbPerMonth ?? 0;

  return (
    <div className="panel">
      <header className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
        <h2 className="label-classified text-ink">Monthly Intelligence — Qualifying Term</h2>
        {segments.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            {segments[0].label} {segments[0].year} – {segments[segments.length - 1].label} {segments[segments.length - 1].year}
          </span>
        )}
      </header>

      {segments.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-ink-muted">Vul de missiegegevens in om de maandelijkse intelligence te tonen.</p>
      ) : (
        <>
          {/* Mission-timeline rail: a connected chain of waypoints, one per
              qualifying-term month, active ones lit and joined by a solid
              gold line. */}
          <div className="hidden items-center border-b border-gold/10 px-8 py-3 sm:flex">
            {segments.map((s, i) => (
              <Fragment key={s.monthKey}>
                {i > 0 && (
                  <div className={`h-px flex-1 ${s.fraction > 0 && segments[i - 1].fraction > 0 ? 'bg-gold/60' : 'bg-white/10'}`} />
                )}
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    s.fraction >= 1 ? 'bg-gold shadow-gold' : s.fraction > 0 ? 'animate-pulse-glow bg-gold' : 'bg-white/15'
                  }`}
                  aria-hidden
                />
              </Fragment>
            ))}
          </div>

          <div className="grid grid-cols-2 divide-gold/10 sm:grid-cols-3 sm:divide-x md:grid-cols-4 lg:grid-cols-5">
            {segments.map((s) => {
              const status = s.fraction >= 1 ? 'FULL' : s.fraction > 0 ? 'PARTIAL' : '—';
              const dailyValue = s.daysInMonth > 0 ? vcdbPerMonth / s.daysInMonth : 0;
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
                  <p className="mt-2 font-display text-2xl font-bold tabular-nums text-gold">{formatVcdbValue(s.value)}</p>
                  <div className="mt-2 h-1.5 w-full bg-white/[0.06]">
                    <div
                      className={`h-full transition-[width] duration-500 ${s.fraction > 0 && s.fraction < 1 ? 'bg-[repeating-linear-gradient(45deg,#E3B23C_0,#E3B23C_4px,transparent_4px,transparent_8px)]' : 'bg-gold-sweep'}`}
                      style={{ width: `${Math.min(100, s.fraction * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] text-ink-muted">
                    {s.overlapDays}/{s.daysInMonth} days · {formatVcdbValue(dailyValue)}/day
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
