import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScoreResult } from '../../types/scoring';
import { formatFactor, formatPercent, formatScore, formatVcdbValue } from '../../utils/format';

interface ShowCalculationPanelProps {
  result: ScoreResult;
}

export function ShowCalculationPanel({ result }: ShowCalculationPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-gold/15">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="label-classified text-gold">Show Calculation</span>
        <ChevronDown size={15} className={`text-gold transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="space-y-5 px-4 pb-5 font-mono text-xs">
          <section>
            <p className="label-classified mb-2">Qualifying Term</p>
            <div className="space-y-1">
              {result.qualifyingTerm.segments.map((s) => (
                <div key={s.monthKey} className="flex items-center justify-between text-ink-muted">
                  <span>
                    {s.label} <span className="text-ink-dim">{s.overlapDays}/{s.daysInMonth}d</span>
                  </span>
                  <span className="text-ink">
                    {formatPercent(s.fraction, 1)} × {formatVcdbValue(result.qualifyingTerm.vcdbPerMonth)} = {formatVcdbValue(s.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gold/10 pt-2 text-gold">
              <span className="uppercase tracking-wider">Total Term Value</span>
              <span className="font-semibold">{formatVcdbValue(result.qualifyingTerm.totalValue)}</span>
            </div>
          </section>

          <section>
            <p className="label-classified mb-2">League Exposure</p>
            <div className="space-y-1">
              {result.leagueExposure.segments.map((s) => (
                <div key={s.monthKey} className="flex items-center justify-between text-ink-muted">
                  <span>{s.label}</span>
                  <span className="text-ink">{s.fraction.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gold/10 pt-2 text-gold">
              <span className="uppercase tracking-wider">Total Exposure</span>
              <span className="font-semibold">{result.leagueExposure.totalExposure.toFixed(3)}</span>
            </div>
          </section>

          <section className="space-y-1.5 border-t border-gold/10 pt-3">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Base Score</span>
              <span className="text-ink">
                {formatVcdbValue(result.qualifyingTerm.totalValue)} × {result.leagueExposure.totalExposure.toFixed(3)} = {formatScore(result.baseScore)}
              </span>
            </div>
            <div className="flex items-center justify-between text-gold">
              <span className="uppercase tracking-wider">Mission Value</span>
              <span className="font-semibold">
                {formatScore(result.baseScore)} × {formatFactor(result.factor)} = {formatScore(result.finalScore)}
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
