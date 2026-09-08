import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { HudCorners } from '../../components/HudCorners';
import { TacticalGrid } from '../../components/TacticalGrid';
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
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <HudCorners />
        <TacticalGrid className="opacity-20" />
        <p className="label-classified relative text-ink-dim">Mission Value</p>
        <p className="relative mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-ink-dim">Awaiting Input</p>
        <p className="relative mt-2 max-w-xs text-xs text-ink-muted">Vul de missiegegevens links in om de score live te berekenen.</p>
      </div>
    );
  }

  if (notEligible) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <HudCorners />
        <TacticalGrid className="opacity-20" />
        <AlertTriangle className="relative text-gold" size={28} aria-hidden />
        <p className="label-classified relative mt-4 text-gold">Mission Status</p>
        <p className="relative mt-2 font-display text-4xl font-bold uppercase text-gold">Not League Eligible</p>
        <p className="relative mt-3 max-w-xs text-xs text-ink-muted">{notEligible.message}</p>
      </div>
    );
  }

  if (errorMessage || !result) {
    return (
      <div className="panel relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden text-center">
        <HudCorners />
        <TacticalGrid className="opacity-20" />
        <AlertTriangle className="relative text-gold" size={28} aria-hidden />
        <p className="relative mt-4 font-display text-3xl font-bold uppercase tracking-wide text-gold">{errorMessage ?? 'Invalid Mission Window'}</p>
      </div>
    );
  }

  return (
    <div className="panel relative flex h-full flex-col overflow-hidden shadow-gold-lg">
      <HudCorners />
      <div key={pulseKey} className="relative overflow-hidden border-b border-gold/15 px-6 py-12 text-center animate-[factor-pulse_0.6s_ease-out] sm:py-16">
        {/* The glow deliberately bleeds past this block's own edges — Mission
            Value is the one element allowed to spill outside its container. */}
        <div
          className="pointer-events-none absolute -inset-x-12 -inset-y-24 opacity-90"
          style={{ background: 'radial-gradient(closest-side, rgba(255,215,104,0.16), rgba(255,215,104,0.05) 55%, transparent 75%)' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-panel-glow" aria-hidden />
        <p className="label-classified relative text-gold/80">Mission Value</p>
        <p className="relative mt-3 break-all font-display text-[56px] font-bold leading-none tabular-nums text-gold-gradient bg-[length:200%_auto] animate-gold-sweep-move drop-shadow-[0_0_46px_rgba(255,215,104,0.45)] sm:text-[88px] lg:text-[112px]">
          {formatScore(animatedValue)}
        </p>
        <p className="relative mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">Points</p>
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

      {/* The natural next step once a Mission Value exists — continues the
          same mission into League Check rather than leaving the calculator
          as a dead end. Fills the remaining flex space so the panel never
          trails off into a flat void when its neighbours run taller. */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 border-t border-gold/10 px-6 py-8 text-center">
        <TacticalGrid className="opacity-20" />
        <p className="label-classified relative text-ink-muted">Volgende stap</p>
        <GoldButton className="relative" onClick={onRunLeagueCheck} icon={<ShieldCheck size={16} />}>
          Run League Check
          <ArrowRight size={15} aria-hidden />
        </GoldButton>
      </div>
    </div>
  );
}
