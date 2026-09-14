import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScoreResult } from '../../types/scoring';
import { formatFactor, formatScore, formatVcdbValue } from '../../utils/format';

interface ShowCalculationPanelProps {
  result: ScoreResult;
}

/** "8,00" — always 2 decimals, matching the rest of the transparent-math figures. */
function formatMonths(value: number): string {
  return formatVcdbValue(value);
}

/**
 * The full, transparent math behind Mission Value — never a black box.
 * Official formula (restored): qualifying duration × VCDB/month = the FIXED
 * MONTHLY MISSION VALUE, which then counts once for every ACTIVE LEAGUE
 * MONTH — not a single one-time multiplication.
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
            <p className="label-classified mb-2">Fixed Monthly Mission Value</p>
            <div className="space-y-1.5 text-ink-muted">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider">Qualifying Duration</span>
                <span className="text-ink">{formatMonths(result.qualifyingDurationMonths)} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider">VCDB / month</span>
                <span className="text-ink">{formatVcdbValue(vcdbPerMonth)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gold/10 pt-2 text-gold">
              <span className="uppercase tracking-wider">Fixed Monthly Mission Value</span>
              <span className="font-semibold">{formatScore(result.fixedMonthlyMissionValue)}</span>
            </div>
          </section>

          <section>
            <p className="label-classified mb-2">Base League Score</p>
            <div className="flex items-center justify-between text-ink-muted">
              <span className="uppercase tracking-wider">Active League Months</span>
              <span className="text-ink">{result.activeLeagueMonths}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gold/10 pt-2 text-gold">
              <span className="uppercase tracking-wider">Base League Score</span>
              <span className="font-semibold">
                {formatScore(result.fixedMonthlyMissionValue)} × {result.activeLeagueMonths} = {formatScore(result.baseScore)}
              </span>
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
