import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScoreResult } from '../../types/scoring';
import { formatFactor, formatScore, formatVcdbValue } from '../../utils/format';

interface ShowCalculationPanelProps {
  result: ScoreResult;
}

/**
 * The full, transparent math behind Mission Value — never a black box.
 * Per qualifying-term month: active days × (monthly VCDB / days in that
 * month) = that month's value. No League Exposure multiplier exists
 * anymore — the sum of these months' values IS the Base Score.
 */
export function ShowCalculationPanel({ result }: ShowCalculationPanelProps) {
  const [open, setOpen] = useState(false);
  const { vcdbPerMonth } = result.qualifyingTerm;

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
                    {s.overlapDays} × ({formatVcdbValue(vcdbPerMonth)}/{s.daysInMonth}) = {formatVcdbValue(s.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gold/10 pt-2 text-gold">
              <span className="uppercase tracking-wider">Total Base Score</span>
              <span className="font-semibold">{formatScore(result.baseScore)}</span>
            </div>
          </section>

          <section className="flex items-center justify-between border-t border-gold/10 pt-3 text-gold">
            <span className="uppercase tracking-wider">Mission Value</span>
            <span className="font-semibold">
              {formatScore(result.baseScore)} × {formatFactor(result.factor)} = {formatScore(result.finalScore)}
            </span>
          </section>
        </div>
      )}
    </div>
  );
}
