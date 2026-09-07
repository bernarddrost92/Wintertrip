import { FactorSelector } from '../../components/FactorSelector';
import { MissionMetric } from '../../components/MissionMetric';
import { formatFactor, formatPoints } from '../../utils/format';
import type { ScoreBreakdown } from '../../types/league';

interface StepSelectFactorProps {
  factor: number;
  onChange: (factor: number) => void;
  baseScore: number;
  breakdown: ScoreBreakdown | null;
}

export function StepSelectFactor({ factor, onChange, baseScore }: StepSelectFactorProps) {
  return (
    <div className="space-y-6">
      <FactorSelector value={factor} onChange={onChange} />
      <div className="panel-inset flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <MissionMetric label="Mission Base Value" value={formatPoints(baseScore)} size="md" />
        <span className="font-display text-2xl text-ink-muted">×</span>
        <MissionMetric label="Factor" value={formatFactor(factor)} size="md" tone="gold" />
        <span className="font-display text-2xl text-ink-muted">=</span>
        <MissionMetric label="Mission Value" value={formatPoints(baseScore * factor)} size="md" tone="gold" />
      </div>
    </div>
  );
}
