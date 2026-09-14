import { Fragment } from 'react';
import { LEAGUE_MONTHS } from '../../config/leagueRules';
import type { ScoreResult } from '../../types/scoring';
import { formatVcdbValue } from '../../utils/format';

interface MonthlyIntelligenceProps {
  result: ScoreResult | null;
}

const LEAGUE_MONTH_KEYS = new Set(LEAGUE_MONTHS.map((m) => `${m.year}-${String(m.month).padStart(2, '0')}`));

/**
 * Shows every calendar month the QUALIFYING TERM itself actually touches —
 * not just the 5 official league months. An extension running to August
 * shows Jan through Aug, a placement running Sep–Apr shows all eight of
 * those months — but only months inside the official league window
 * (01-09-2026 t/m 31-01-2027) count as an ACTIVE LEAGUE MONTH and earn the
 * FIXED MONTHLY MISSION VALUE; months past January are OUTSIDE LEAGUE and
 * earn nothing, however real their own day coverage is.
 */
export function MonthlyIntelligence({ result }: MonthlyIntelligenceProps) {
  const segments = result?.qualifyingTerm.segments ?? [];
  const fixedMonthlyMissionValue = result?.fixedMonthlyMissionValue ?? 0;

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
              qualifying-term month — lit gold for an ACTIVE LEAGUE MONTH
              (inside 01-09-2026 t/m 31-01-2027), dim for a month the term
              touches but that falls outside the league window. */}
          <div className="hidden items-center border-b border-gold/10 px-8 py-3 sm:flex">
            {segments.map((s, i) => {
              const active = LEAGUE_MONTH_KEYS.has(s.monthKey);
              const prevActive = i > 0 && LEAGUE_MONTH_KEYS.has(segments[i - 1].monthKey);
              return (
                <Fragment key={s.monthKey}>
                  {i > 0 && <div className={`h-px flex-1 ${active && prevActive ? 'bg-gold/60' : 'bg-white/10'}`} />}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-gold shadow-gold' : 'bg-white/15'}`} aria-hidden />
                </Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-2 divide-gold/10 sm:grid-cols-3 sm:divide-x md:grid-cols-4 lg:grid-cols-5">
            {segments.map((s) => {
              const active = LEAGUE_MONTH_KEYS.has(s.monthKey);
              const dayStatus = s.fraction >= 1 ? 'FULL' : s.fraction > 0 ? 'PARTIAL' : '—';
              return (
                <div key={s.monthKey} className="border-b border-gold/10 px-4 py-4 sm:border-b-0">
                  <div className="flex items-baseline justify-between">
                    <span className={`font-display text-lg font-bold tracking-wide ${active ? 'text-ink' : 'text-ink-dim'}`}>{s.label}</span>
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${active ? 'text-gold' : 'text-ink-dim'}`}>
                      {active ? 'ACTIVE LEAGUE MONTH' : 'OUTSIDE LEAGUE'}
                    </span>
                  </div>
                  <p className={`mt-2 font-display text-2xl font-bold tabular-nums ${active ? 'text-gold' : 'text-ink-dim'}`}>
                    {active ? formatVcdbValue(fixedMonthlyMissionValue) : '—'}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-white/[0.06]">
                    <div
                      className={`h-full transition-[width] duration-500 ${active ? 'bg-gold-sweep' : 'bg-white/15'}`}
                      style={{ width: `${Math.min(100, s.fraction * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] text-ink-muted">
                    {dayStatus} · {s.overlapDays}/{s.daysInMonth} days
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
