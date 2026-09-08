import { SectionHeader } from '../../components/SectionHeader';
import type { ProductionDataQuality } from '../../types/production';

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
 * A defensive read of the snapshot's known gaps — never silently corrected
 * or guessed at. When the exact date-check count can't be determined
 * reliably, this shows a qualitative flag instead of a fabricated number
 * (see services/production.ts).
 */
export function ProductionDataQualitySection({ quality }: { quality: ProductionDataQuality }) {
  return (
    <div className="panel p-5 sm:p-6">
      <SectionHeader eyebrow="Marre's snapshot" title="Data Quality" subtitle="Wat nog aangevuld of gecontroleerd moet worden." />
      <div className="mt-5 border border-white/10 bg-mission-panel/50">
        <QualityRow label="TM Missing" value={`${quality.missingTmCount}`} tone={quality.missingTmCount > 0 ? 'warn' : 'muted'} />
        <QualityRow label="DB Missing" value={`${quality.missingDbCount}`} tone={quality.missingDbCount > 0 ? 'warn' : 'muted'} />
        <QualityRow
          label="Date Check"
          value={quality.dateCheckCount === null ? 'Review' : `${quality.dateCheckCount}`}
          tone={quality.dateCheckCount === null || quality.dateCheckCount > 0 ? 'warn' : 'muted'}
        />
      </div>
    </div>
  );
}
