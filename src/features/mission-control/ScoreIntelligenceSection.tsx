import { AlertTriangle, WifiOff } from 'lucide-react';
import { SectionHeader } from '../../components/SectionHeader';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import type { TeamProductionTotal } from '../../services/productionAggregate';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

interface ScoreIntelligenceSectionProps {
  team: TeamProductionTotal;
  mock: boolean;
  degraded: boolean;
  powerBi: PowerBiIntelligenceSnapshot;
  currentFteFactor: number | null;
}

/**
 * Where our points come from, at a glance — three side-by-side stat
 * blocks, each carrying its own data-source label so Base League Points
 * (live Marre production feed, services/productionAggregate.ts) is never
 * mistaken for the same figure/formula as Power BI's VCDB Score or Virtual
 * Final Score (a separate, official snapshot). No arrows or formulas
 * connect the three — they are independent readings, not a pipeline.
 */
export function ScoreIntelligenceSection({ team, mock, degraded, powerBi, currentFteFactor }: ScoreIntelligenceSectionProps) {
  return (
    <div className="panel p-4 sm:p-5">
      <SectionHeader eyebrow="007 · Mission Control" title="Score Intelligence" />

      {(degraded || mock) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {degraded && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold/80">
              <WifiOff size={12} className="shrink-0 text-gold" aria-hidden />
              Data Connection Degraded
            </p>
          )}
          {mock && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold/80">
              <AlertTriangle size={12} className="shrink-0 text-gold" aria-hidden />
              Mock Data — Not The Actual Zwolle Production
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-3">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified text-gold/70">Mission Control</p>
          <p className="text-[11px] text-ink-muted">Base League Points</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">{formatVcdbValue(team.totalBaseLeaguePoints)}</p>
          <p className="label-classified mt-1">Live Production Feed</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            {team.qualifyingDeals} Qualifying · {team.scoringPending} Pending
          </p>
        </div>
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
