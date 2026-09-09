import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import { calculateFteGap } from '../../services/fteRoad';
import { formatVcdbValue } from '../../utils/format';
import type { FteSnapshot } from '../../types/missionSnapshot';

function formatFteOrDash(value: number | null): string {
  return value === null ? '—' : formatVcdbValue(value);
}

/**
 * The most important action block on Mission Control — how far Zwolle
 * still is from the next FTE ranking position, dominant and immediate,
 * followed by a compact tactical path through the remaining reference
 * positions. The gap math is unchanged (services/fteRoad.ts): a missing
 * fixed 31 Jan target never fabricates a "still needed" number and stays
 * tucked into a small secondary block until real target data exists.
 */
export function RoadToJan31Card({ fte }: { fte: FteSnapshot }) {
  const currentNetFte = fte.currentNetFte ?? null;
  const milestones = fte.fteMilestones ?? [];
  const nextMilestone = milestones[0] ?? null;
  const gap = calculateFteGap(fte.targetFteOnJan31, fte.projectedFteOnJan31);

  const pathNodes =
    currentNetFte !== null && milestones.length > 0
      ? [
          { key: 'start', label: fte.netFteRanking != null ? `#${fte.netFteRanking}` : '#—', sub: 'Zwolle', value: formatVcdbValue(currentNetFte), start: true },
          ...milestones.map((m) => ({ key: `m${m.position}`, label: `#${m.position}`, sub: m.team, value: `+${formatVcdbValue(m.gapFte)}`, start: false })),
        ]
      : [];

  return (
    <div className="panel p-4 sm:p-5">
      <div>
        <p className="label-classified text-gold/70">Road to 31 Jan</p>
        <h2 className="mt-1 font-display text-xl font-black uppercase tracking-tight text-ink sm:text-2xl">Mission Objective</h2>
        <p className="label-classified mt-1 text-ink-muted">Measurement Date · 31 Jan 2027</p>
      </div>

      {nextMilestone && (
        <div className="mt-4 border-t border-white/10 pt-4 text-center sm:text-left">
          <p className="label-classified">Next FTE Milestone</p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-gold sm:text-4xl">#{nextMilestone.position}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink">
            {formatVcdbValue(nextMilestone.gapFte)} FTE Improvement Needed
          </p>
          <p className="label-classified mt-1 text-ink-muted">
            To Current #{nextMilestone.position} · {nextMilestone.team}
          </p>
        </div>
      )}

      {pathNodes.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0 sm:overflow-x-auto">
          {pathNodes.map((node, i) => (
            <Fragment key={node.key}>
              {i > 0 && <span className="hidden shrink-0 self-center px-2 text-ink-dim sm:inline">→</span>}
              <div className={`shrink-0 border px-3 py-2 text-center sm:min-w-[92px] ${node.start ? 'border-gold/30 bg-gold/5' : 'border-white/10 bg-mission-panel'}`}>
                <p className="label-classified">{node.label}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink-muted">{node.sub}</p>
                <p className={`mt-1 font-display text-sm font-semibold tabular-nums ${node.start ? 'text-ink' : 'text-gold'}`}>{node.value}</p>
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {fte.expiringBeforeJan31Fte != null && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold/80 sm:justify-start">
          <AlertTriangle size={13} className="shrink-0 text-gold" aria-hidden />
          At Risk Before 31 Jan — {formatVcdbValue(fte.expiringBeforeJan31Fte)} FTE
        </p>
      )}

      <div className="mt-4 border-t border-white/10 pt-3">
        {fte.targetFteOnJan31 === null ? (
          <div className="flex items-center justify-between gap-3">
            <p className="label-classified">31 Jan FTE Target</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Awaiting Intelligence</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
            <p className="label-classified">
              Projected FTE · 31 Jan <span className="text-ink">{formatFteOrDash(fte.projectedFteOnJan31)}</span>
            </p>
            <p className="label-classified">
              Target <span className="text-ink">{formatVcdbValue(fte.targetFteOnJan31)}</span>
            </p>
            {gap.kind === 'gap' && <p className="font-semibold text-gold">Gap {formatVcdbValue(gap.amount)} FTE</p>}
            {gap.kind === 'secured' && (
              <p className="font-semibold text-status-go">Target Secured{gap.buffer > 0 && ` · +${formatVcdbValue(gap.buffer)} FTE Buffer`}</p>
            )}
            {gap.kind === 'awaiting-projection' && <p className="text-ink-muted">Projected FTE Pending</p>}
          </div>
        )}
      </div>
    </div>
  );
}
