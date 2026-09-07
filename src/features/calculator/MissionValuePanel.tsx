import { AlertTriangle } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import { formatScore, formatSignedScore } from '../../utils/format';
import { FactorIntelligence } from './FactorIntelligence';
import { ShowCalculationPanel } from './ShowCalculationPanel';
import type { CalculatorOutput } from './useMissionControlCalculator';

interface MissionValuePanelProps {
  output: CalculatorOutput;
}

export function MissionValuePanel({ output }: MissionValuePanelProps) {
  const { result, isInputComplete, errorMessage, notEligible } = output;
  const animatedValue = useCountUp(result?.finalScore ?? 0);

  if (!isInputComplete) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <p className="label-classified text-ink-dim">Mission Value</p>
        <p className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-ink-dim">Awaiting Input</p>
        <p className="mt-2 max-w-xs text-xs text-ink-muted">Vul de missiegegevens links in om de score live te berekenen.</p>
      </div>
    );
  }

  if (notEligible) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <AlertTriangle className="text-gold" size={28} aria-hidden />
        <p className="label-classified mt-4 text-gold">Mission Status</p>
        <p className="mt-2 font-display text-4xl font-bold uppercase text-gold">Not League Eligible</p>
        <p className="mt-3 max-w-xs text-xs text-ink-muted">{notEligible.message}</p>
      </div>
    );
  }

  if (errorMessage || !result) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <AlertTriangle className="text-gold" size={28} aria-hidden />
        <p className="mt-4 font-display text-3xl font-bold uppercase tracking-wide text-gold">{errorMessage ?? 'Invalid Mission Window'}</p>
      </div>
    );
  }

  return (
    <div className="panel relative flex h-full flex-col overflow-hidden">
      <div className="relative overflow-hidden border-b border-gold/15 px-6 py-10 text-center sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-panel-glow" aria-hidden />
        <p className="label-classified relative text-gold/80">Mission Value</p>
        <p className="relative mt-3 font-display text-[72px] font-bold leading-none tabular-nums text-gold-gradient bg-[length:200%_auto] animate-gold-sweep-move sm:text-[104px] lg:text-[128px]">
          {formatScore(animatedValue)}
        </p>
        <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">Points</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gold/15 border-b border-gold/15">
        <div className="px-4 py-4 text-center">
          <p className="label-classified">Base Score</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-ink">{formatScore(result.baseScore)}</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="label-classified">Factor</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-ink">{result.factor.toLocaleString('nl-NL')}x</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="label-classified">Factor Bonus</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-gold">{formatSignedScore(result.factorImpact)}</p>
        </div>
      </div>

      <FactorIntelligence baseScore={result.baseScore} selectedFactor={result.factor} />
      <ShowCalculationPanel result={result} />
    </div>
  );
}
