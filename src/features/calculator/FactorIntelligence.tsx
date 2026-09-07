import { calculateFactorScenarios } from '../../services/scoring';
import { formatFactor, formatScore, formatSignedScore } from '../../utils/format';

interface FactorIntelligenceProps {
  baseScore: number;
  selectedFactor: number;
}

/** Compact "what would each ranking scenario be worth" comparison strip. */
export function FactorIntelligence({ baseScore, selectedFactor }: FactorIntelligenceProps) {
  const scenarios = calculateFactorScenarios(baseScore, selectedFactor);
  const top = scenarios[0];
  const bottom = scenarios[scenarios.length - 2] ?? scenarios[scenarios.length - 1]; // #6–10, excluding "no factor"
  const spread = top.finalScore - bottom.finalScore;

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="label-classified text-ink">Factor Intelligence</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">#1 vs #6–10</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-px bg-gold/10 px-4 sm:grid-cols-7">
        {scenarios.map((s) => (
          <div key={s.position + s.value} className={`bg-mission-panel px-2 py-2.5 text-center ${s.isSelected ? 'bg-gold/10' : ''}`}>
            <p className={`font-mono text-[10px] uppercase tracking-wider ${s.isSelected ? 'text-gold' : 'text-ink-muted'}`}>
              {formatFactor(s.value)}
            </p>
            <p className={`mt-1 font-display text-base font-semibold tabular-nums ${s.isSelected ? 'text-gold' : 'text-ink'}`}>
              {formatScore(s.finalScore)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gold/10 px-4 py-3">
        <span className="label-classified">#1 factor effect</span>
        <span className="font-display text-lg font-semibold tabular-nums text-gold">{formatSignedScore(spread)}</span>
      </div>
    </div>
  );
}
