import { SectionHeader } from '../../components/SectionHeader';
import type { ProductionDataQuality } from '../../services/productionAggregate';

function QualityRow({ label, value, tone }: { label: string; value: string; tone: 'warn' | 'muted' }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-b-0 sm:px-5">
      <span className="text-sm text-ink">{label}</span>
      <span className={`font-display text-lg font-semibold tabular-nums ${tone === 'warn' ? 'text-gold' : 'text-ink-muted'}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * A defensive read of the current feed's known gaps — never silently
 * corrected or guessed at, always recomputed from the live records (see
 * services/productionAggregate.ts#getProductionDataQuality). SCORING
 * MISMATCH flags a real disagreement between our calculatedLeagueScore and
 * the Sheet's own League score column beyond the 0.01-point tolerance —
 * never a second scoring formula, just a comparison.
 */
export function ProductionDataQualitySection({ quality }: { quality: ProductionDataQuality }) {
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Marre Production Feed" title="Data Quality" subtitle="Wat nog aangevuld of gecontroleerd moet worden." />
      <div className="mt-5 border border-white/10 bg-mission-panel/50">
        <QualityRow
          label="Scoring Pending"
          value={`${quality.scoringPendingCount}`}
          tone={quality.scoringPendingCount > 0 ? 'warn' : 'muted'}
        />
        <QualityRow
          label="Scoring Mismatch"
          value={`${quality.scoringMismatchCount}`}
          tone={quality.scoringMismatchCount > 0 ? 'warn' : 'muted'}
        />
      </div>
    </div>
  );
}
