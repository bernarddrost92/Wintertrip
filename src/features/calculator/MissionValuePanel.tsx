import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { useCountUp } from '../../hooks/useCountUp';
import { useFactorPulse } from '../../hooks/useFactorPulse';
import { formatScore, formatSignedScore } from '../../utils/format';
import { FactorIntelligence } from './FactorIntelligence';
import { ShowCalculationPanel } from './ShowCalculationPanel';
import type { CalculatorOutput } from './useMissionControlCalculator';

interface MissionValuePanelProps {
  output: CalculatorOutput;
  onRunLeagueCheck: () => void;
}

export function MissionValuePanel({ output, onRunLeagueCheck }: MissionValuePanelProps) {
  const { result, isInputComplete, errorMessage, notEligible } = output;
  const animatedValue = useCountUp(result?.finalScore ?? 0);
  const pulseKey = useFactorPulse(result?.factor);

  if (!isInputComplete) {
    return (
      // Calm, not a big empty result panel: one line until there is a score.
      <div className="flex h-full min-h-[120px] items-center justify-center border border-dashed border-white/10 px-6 py-8 text-center lg:min-h-[320px]">
        <p className="max-w-xs text-[15px] text-ink-muted">Vul de gegevens in. Je score verschijnt hier.</p>
      </div>
    );
  }

  if (notEligible) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <AlertTriangle className="relative text-gold" size={28} aria-hidden />
        <p className="relative mt-3 font-display text-3xl font-bold uppercase text-gold">Telt niet mee</p>
        <p className="relative mt-2 max-w-xs text-[15px] text-ink-muted">{notEligible.message}</p>
      </div>
    );
  }

  if (errorMessage || !result) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <AlertTriangle className="relative text-gold" size={28} aria-hidden />
        <p className="relative mt-4 max-w-sm text-lg font-semibold text-gold">{errorMessage ?? 'Controleer de datums.'}</p>
      </div>
    );
  }

  return (
    <div className="panel relative flex h-full flex-col overflow-hidden border-gold/25">
      <div key={pulseKey} className="relative overflow-hidden border-b border-white/[0.07] px-6 py-12 text-center animate-[factor-pulse_0.6s_ease-out] sm:py-16">
        {/* The glow deliberately bleeds past this block's own edges — Mission
            Value is the one element allowed to spill outside its container. */}
        <div
          className="pointer-events-none absolute -inset-x-12 -inset-y-24 opacity-90"
          style={{ background: 'radial-gradient(closest-side, rgba(214,174,85,0.1), rgba(214,174,85,0.03) 55%, transparent 75%)' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-panel-glow" aria-hidden />
        <p className="relative text-sm font-semibold text-gold/90">Jouw score</p>
        <p className="relative mt-3 break-all font-display text-[56px] font-bold leading-none tabular-nums text-gold-gradient drop-shadow-[0_0_22px_rgba(214,174,85,0.14)] sm:text-[88px] lg:text-[112px]">
          {formatScore(animatedValue)}
        </p>
        <p className="relative mt-2 text-sm text-ink-muted">punten</p>
        {/* The next step sits right under the score — the one gold action. */}
        <GoldButton className="relative mt-7" onClick={onRunLeagueCheck} icon={<ShieldCheck size={16} />}>
          Door naar League Check
          <ArrowRight size={15} aria-hidden />
        </GoldButton>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-white/[0.07] border-b border-white/[0.07]">
        <div className="px-3 py-4 text-center">
          <dt className="text-[13px] text-ink-muted">Basis</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatScore(result.baseScore)}</dd>
        </div>
        <div className="px-3 py-4 text-center">
          <dt className="text-[13px] text-ink-muted">Factor</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{result.factor.toLocaleString('nl-NL')}x</dd>
        </div>
        <div className="px-3 py-4 text-center">
          <dt className="text-[13px] text-ink-muted">Factorbonus</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-gold">{formatSignedScore(result.factorImpact)}</dd>
        </div>
      </dl>

      {/* Extra context only on request. */}
      <details className="group border-b border-white/[0.07]">
        <summary className="flex min-h-12 cursor-pointer select-none items-center px-4 text-sm font-medium text-ink-muted hover:text-ink group-open:text-ink">
          Wat als de factor anders is?
        </summary>
        <div className="pb-2">
          <FactorIntelligence baseScore={result.baseScore} selectedFactor={result.factor} />
        </div>
      </details>
      <ShowCalculationPanel result={result} />
    </div>
  );
}
