import { ArrowRight, Crosshair, TrendingDown, TrendingUp } from 'lucide-react';
import { nextNetFteTarget, teamsPassedInNetFte, type StandingsProjection } from '../../services/netFteProjection';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';

interface ProjectionReadoutProps {
  projection: StandingsProjection;
}

function RankShift({ from, to }: { from: number; to: number }) {
  if (from === to) return <span className="text-ink-muted">=</span>;
  const up = to < from;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 ${up ? 'text-status-go' : 'text-red-300'}`}>
      <Icon size={12} aria-hidden />
      {Math.abs(from - to)}
    </span>
  );
}

/**
 * Official → projected, side by side: Net FTE, Net FTE rank, factor and
 * Final Score/position, plus who is passed and what the next target needs.
 * Always derived from services/netFteProjection.ts — no maths here.
 */
export function ProjectionReadout({ projection }: ProjectionReadoutProps) {
  const { own } = projection;
  const official = own.official;
  const passed = teamsPassedInNetFte(projection);
  const next = nextNetFteTarget(projection);

  const rows = [
    { label: 'Net FTE', from: formatVcdbValue(official.netFte), to: formatVcdbValue(own.netFte), shift: null },
    { label: 'FTE-rank', from: `#${official.netFteRanking}`, to: `#${own.netFteRanking}`, shift: <RankShift from={official.netFteRanking} to={own.netFteRanking} /> },
    { label: 'Factor', from: formatFactor(official.factor), to: formatFactor(own.factor), shift: null },
    { label: 'Final Score', from: formatVcdbValue(official.finalScore), to: formatVcdbValue(own.finalScore), shift: null },
    { label: 'Positie', from: `#${official.finalRanking}`, to: `#${own.finalRanking}`, shift: <RankShift from={official.finalRanking} to={own.finalRanking} /> },
  ];

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-px border border-white/10 bg-white/5 sm:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="bg-mission-panel px-3 py-2.5">
            <dt className="label-classified">{row.label}</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
              <span className="text-xs text-ink-muted">{row.from}</span>
              <ArrowRight size={11} className="text-ink-dim" aria-hidden />
              <span className="font-display text-lg font-bold text-intel">{row.to}</span>
              {row.shift && <span className="text-xs">{row.shift}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
        {passed.length > 0 && (
          <p className="text-ink">
            <span className="text-status-go">Voorbij:</span> {passed.join(', ')}
          </p>
        )}
        {next ? (
          <p className="flex items-center gap-1.5 text-ink">
            <Crosshair size={13} className="shrink-0 text-gold" aria-hidden />
            Volgende: <span className="font-semibold">{next.team}</span> (#{next.rank}) · nog{' '}
            <span className="font-semibold text-gold">{formatSignedFte(next.fteNeeded)} FTE</span>
          </p>
        ) : (
          <p className="font-semibold text-gold">#1 in de Net FTE-ranking</p>
        )}
      </div>
    </div>
  );
}
