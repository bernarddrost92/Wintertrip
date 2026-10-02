import { SectionHeader } from '../../components/SectionHeader';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

interface ScoreIntelligenceSectionProps {
  powerBi: PowerBiIntelligenceSnapshot;
  currentFteFactor: number | null;
}

/**
 * Where our points stand, at a glance — Power BI's VCDB Score and Virtual
 * Final Score side by side, both from the official manual snapshot. Base
 * League Points (from Marre's production feed) used to sit next to them;
 * that feed is no longer maintained, so it has been removed rather than
 * left showing stale or mock numbers.
 */
export function ScoreIntelligenceSection({ powerBi, currentFteFactor }: ScoreIntelligenceSectionProps) {
  return (
    <div className="panel p-4 sm:p-5">
      <SectionHeader eyebrow="007 · Mission Control" title="Score Intelligence" />

      <div className="mt-4 grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-2">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified text-gold/70">Power BI</p>
          <p className="text-[11px] text-ink-muted">VCDB Score</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {powerBi.vcdbScore != null ? formatVcdbValue(powerBi.vcdbScore) : '—'}
          </p>
          <p className="label-classified mt-1">Official Power BI Snapshot</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified text-gold/70">Power BI</p>
          <p className="text-[11px] text-ink-muted">Virtual Final Score</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {powerBi.finalScore != null ? formatVcdbValue(powerBi.finalScore) : '—'}
          </p>
          <p className="label-classified mt-1">Official Power BI Snapshot</p>
          {currentFteFactor != null && <p className="mt-1 text-[11px] text-ink-muted">Current FTE Factor · {formatFactor(currentFteFactor)}</p>}
        </div>
      </div>
    </div>
  );
}
