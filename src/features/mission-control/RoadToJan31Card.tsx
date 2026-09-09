import { AlertTriangle } from 'lucide-react';
import { calculateFteGap, calculateFteGapToBenchmark, calculateFteProgress } from '../../services/fteRoad';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import type { FteSnapshot } from '../../types/missionSnapshot';

function formatFteOrDash(value: number | null): string {
  return value === null ? '—' : formatVcdbValue(value);
}

/** Always rendered in Europe/Amsterdam — the team's own timezone, not the viewer's — so the snapshot time reads the same for everyone. */
function formatSnapshotTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

/**
 * Net active FTE Team Zwolle still needs on the 31 Jan 2027 measurement
 * date — not a count of placements made. The gap/progress figures are
 * computed centrally (services/fteRoad.ts) and never fabricated: a missing
 * target reads as AWAITING TARGET, a missing projection as a pending
 * state, and the progress bar simply doesn't render without both figures.
 */
export function RoadToJan31Card({ fte }: { fte: FteSnapshot }) {
  const gap = calculateFteGap(fte.targetFteOnJan31, fte.projectedFteOnJan31);
  const progress = calculateFteProgress(fte.projectedFteOnJan31, fte.targetFteOnJan31);
  const updatedAt = fte.snapshotUpdatedAt ?? null;
  const currentNetFte = fte.currentNetFte ?? null;
  const currentNumberOneBenchmark = fte.currentNumberOneBenchmark ?? null;
  const benchmarkGap = calculateFteGapToBenchmark(currentNetFte, currentNumberOneBenchmark);
  const milestones = fte.fteMilestones ?? [];

  return (
    <div className="panel p-6 sm:p-8">
      <div>
        <p className="label-classified text-gold/70">Road to 31 Jan</p>
        <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">FTE Objective</h2>
        <p className="label-classified mt-1 text-ink-muted">Measurement Date · 31 Jan 2027</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-3">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Current / Baseline FTE</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatFteOrDash(fte.baselineFte)}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Projected FTE · 31 Jan</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatFteOrDash(fte.projectedFteOnJan31)}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          {fte.targetFteOnJan31 !== null ? (
            <>
              <p className="label-classified">Target FTE · 31 Jan</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatVcdbValue(fte.targetFteOnJan31)}</p>
            </>
          ) : (
            <>
              <p className="label-classified">FTE Target</p>
              <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-ink-muted">Awaiting Target</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-center sm:text-left">
        {gap.kind === 'gap' && (
          <p className="font-display text-4xl font-black uppercase tabular-nums text-gold sm:text-5xl">
            Nog {formatVcdbValue(gap.amount)} FTE Nodig
          </p>
        )}
        {gap.kind === 'secured' && (
          <>
            <p className="font-display text-4xl font-black uppercase tabular-nums text-status-go sm:text-5xl">FTE Target Secured</p>
            {gap.buffer > 0 && (
              <p className="label-classified mt-2 text-status-go/80">+{formatVcdbValue(gap.buffer)} FTE Buffer</p>
            )}
          </>
        )}
        {gap.kind === 'awaiting-projection' && (
          <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink-muted">Projected FTE Pending</p>
        )}
      </div>

      {currentNetFte !== null && currentNumberOneBenchmark !== null && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-3">
            <div className="bg-mission-panel px-4 py-3">
              <p className="label-classified">Net FTE Position</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                {fte.netFteRanking != null ? `#${fte.netFteRanking}` : '—'}
              </p>
            </div>
            <div className="bg-mission-panel px-4 py-3">
              <p className="label-classified">Current Net FTE</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatVcdbValue(currentNetFte)}</p>
            </div>
            <div className="bg-mission-panel px-4 py-3">
              <p className="label-classified">Current #1 Benchmark</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatVcdbValue(currentNumberOneBenchmark)}</p>
            </div>
          </div>

          {benchmarkGap !== null && (
            <div className="mt-6 text-center sm:text-left">
              <p className="label-classified">Gap To Current #1</p>
              <p className="font-display text-4xl font-black uppercase tabular-nums text-gold sm:text-5xl">{formatVcdbValue(benchmarkGap)} FTE</p>
              <p className="label-classified mt-2 text-ink-muted">Dynamic Benchmark · Based On Current Power BI Ranking</p>
            </div>
          )}

          {milestones.length > 0 && (
            <div className="mt-6">
              <p className="label-classified">FTE Milestones</p>
              <p className="mt-1 text-xs text-ink-muted">Improvement needed vs. current Net FTE — not yet realized.</p>
              <ul className="mt-3 grid grid-cols-2 gap-px border border-white/10 bg-white/5 sm:grid-cols-4">
                {milestones.map((m) => (
                  <li key={m.position} className="bg-mission-panel px-4 py-3 text-center">
                    <p className="label-classified">#{m.position}</p>
                    <p className="mt-1 font-display text-lg font-semibold tabular-nums text-gold">+{formatVcdbValue(m.gapFte)} FTE</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fte.currentFteFactor != null && (
            <div className="mt-6">
              <p className="label-classified">Current FTE Factor</p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">{formatFactor(fte.currentFteFactor)}</p>
            </div>
          )}
        </div>
      )}

      {fte.expiringBeforeJan31Fte != null && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold/80 sm:justify-start">
          <AlertTriangle size={13} className="shrink-0 text-gold" aria-hidden />
          At Risk Before 31 Jan — {formatVcdbValue(fte.expiringBeforeJan31Fte)} FTE
        </p>
      )}

      {progress && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="label-classified">Progress</p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {formatVcdbValue(fte.projectedFteOnJan31 as number)} / {formatVcdbValue(fte.targetFteOnJan31 as number)} FTE
              {progress.overTarget > 0 && <span className="ml-2 text-status-go">Target + {formatVcdbValue(progress.overTarget)} FTE</span>}
            </p>
          </div>
          <div className="mt-2 h-2 w-full border border-gold/20 bg-mission-panel">
            <div
              className="h-full bg-gold-sweep bg-[length:200%_auto] transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="label-classified">FTE Intelligence</p>
        <p className="mt-1 text-xs text-ink-muted">{updatedAt ? `Updated · ${formatSnapshotTime(updatedAt)}` : 'Awaiting Update'}</p>
      </div>
    </div>
  );
}
