import { Trophy } from 'lucide-react';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { factorSteps, projectStandings } from '../../services/netFteProjection';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';

interface FactorLadderProps {
  standings: PowerBiStandingRow[];
  /** FTE already counted on top of the official stand (open bonnen). */
  baseFte: number;
}

/**
 * The FTE ladder: every factor tier above Zwolle's current one, the team to
 * pass for it, the FTE still needed (on top of official + open bonnen), and
 * what it does to the Final Score and position. The first tier that changes
 * the Final Ranking position is highlighted — that's the score-impact.
 */
export function FactorLadder({ standings, baseFte }: FactorLadderProps) {
  const base = projectStandings(standings, OWN_TEAM, baseFte);
  const steps = factorSteps(standings, OWN_TEAM, baseFte);
  const firstPositionGain = steps.find((step) => step.finalRanking < base.own.finalRanking);

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="fte-ladder">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="fte-ladder" className="font-display text-2xl font-black uppercase tracking-tight text-ink">
          FTE-ladder
        </h2>
        <p className="text-xs text-ink-muted">
          Vanaf {baseFte !== 0 ? `projectie incl. open bonnen (${formatVcdbValue(base.own.netFte)})` : `de officiële stand (${formatVcdbValue(base.own.netFte)})`} · nu{' '}
          {formatFactor(base.own.factor)}
        </p>
      </div>

      {steps.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-gold">Zwolle heeft de hoogste factor al.</p>
      ) : (
        <ol className="mt-4 divide-y divide-white/10 border border-white/10 bg-mission-panel">
          {steps.map((step) => {
            const highlight = step === firstPositionGain;
            return (
              <li
                key={step.factor}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 sm:grid-cols-[72px_minmax(0,1fr)_130px_230px] ${
                  highlight ? 'bg-gold/10' : ''
                }`}
              >
                <span className="font-display text-2xl font-black tabular-nums text-gold">{formatFactor(step.factor)}</span>
                <span className="min-w-0 text-sm text-ink">
                  FTE-rank <span className="font-semibold">#{step.rank}</span> · voorbij <span className="font-semibold">{step.team}</span>
                </span>
                <span className="text-right font-display text-lg font-bold tabular-nums text-intel sm:text-left">{formatSignedFte(step.fteNeeded)} FTE</span>
                <span className="col-span-3 flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-muted sm:col-span-1 sm:justify-end sm:text-right">
                  {highlight && <Trophy size={12} className="text-gold" aria-hidden />}
                  Final {formatVcdbValue(step.finalScore)} ·{' '}
                  <span className={step.finalRanking < base.own.finalRanking ? 'font-semibold text-gold' : ''}>positie #{step.finalRanking}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {base.hiddenRanks.length > 0 && (
        <p className="mt-3 text-[11px] text-ink-dim">
          Net FTE-rang {base.hiddenRanks.map((r) => `#${r}`).join(', ')} hoort bij een team dat niet in de eindstand staat; in de projectie telt het als
          gelijk aan het team erboven.
        </p>
      )}
    </section>
  );
}
