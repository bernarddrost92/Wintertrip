import { formatVcdbValue } from '../../utils/format';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

/** Always rendered in Europe/Amsterdam — the team's own timezone, not the viewer's — so the snapshot time reads the same for everyone. */
function formatSnapshotTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  const zone = 'Europe/Amsterdam';
  const day = date.toLocaleString('en-GB', { day: '2-digit', timeZone: zone });
  const month = date.toLocaleString('en-GB', { month: 'short', timeZone: zone }).slice(0, 3).toUpperCase();
  const year = date.toLocaleString('en-GB', { year: 'numeric', timeZone: zone });
  const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone });
  return `${day} ${month} ${year} · ${time}`;
}

/**
 * Manual Power BI ranking intelligence — VCDB score/ranking, the Power
 * BI Virtual Final Score, and the Virtual Top 3. The Final Score is
 * deliberately never written into services/productionAggregate.ts's Base
 * League Points: it's Power BI's own separate snapshot figure, labelled
 * as such throughout.
 */
export function PowerBiIntelligenceCard({ powerBi }: { powerBi: PowerBiIntelligenceSnapshot }) {
  return (
    <div className="panel p-6 sm:p-8">
      <p className="label-classified text-gold/70">Power BI Intelligence</p>
      <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">Virtual Ranking</h2>

      <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/5 sm:grid-cols-4">
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">VCDB Ranking</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">
            {powerBi.vcdbRanking != null ? `#${powerBi.vcdbRanking}` : '—'}
          </p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">VCDB Score</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">
            {powerBi.vcdbScore != null ? formatVcdbValue(powerBi.vcdbScore) : '—'}
          </p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Placements In Scope</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">{powerBi.placementsInScope ?? '—'}</p>
        </div>
        <div className="bg-mission-panel px-4 py-3">
          <p className="label-classified">Extra Hours Rule</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">{powerBi.placementsExtraHoursRule ?? '—'}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="label-classified">Power BI Virtual Final Score</p>
        <p className="mt-1 font-display text-4xl font-black tabular-nums text-gold sm:text-5xl">
          {powerBi.finalScore != null ? formatVcdbValue(powerBi.finalScore) : '—'}
        </p>
        <p className="mt-1 text-xs text-ink-muted">Separate from Mission Control&rsquo;s own Base League Points.</p>
      </div>

      {powerBi.topThree.length > 0 && (
        <div className="mt-6">
          <p className="label-classified">Virtual Top 3</p>
          <ul className="mt-3 divide-y divide-white/10 border border-white/10 bg-mission-panel/50">
            {powerBi.topThree.map((entry) => (
              <li key={entry.position} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium uppercase tracking-wide text-ink">
                  {entry.position} · {entry.team}
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-gold">{formatVcdbValue(entry.finalScore)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="label-classified">Last Refresh</p>
        <p className="mt-1 text-xs text-ink-muted">
          {powerBi.updatedAt ? `${formatSnapshotTime(powerBi.updatedAt)} · Manual Snapshot` : 'Awaiting Update'}
        </p>
      </div>
    </div>
  );
}
