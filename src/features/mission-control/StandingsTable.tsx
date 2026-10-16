import { StandBadge } from '../../components/StandBadge';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { hiddenNetFteRanks } from '../../services/netFteProjection';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';

interface StandingsTableProps {
  standings: PowerBiStandingRow[];
  updatedAt: string;
}

const HEADERS = [
  { label: '#', className: 'w-10 text-left' },
  { label: 'Team', className: 'text-left' },
  { label: 'VCDB', className: 'text-right' },
  { label: 'Net FTE', className: 'text-right' },
  { label: 'FTE #', className: 'text-right' },
  { label: 'Factor', className: 'text-right' },
  { label: 'Final Score', className: 'text-right' },
];

/**
 * The official Final Ranking with a Net FTE lens — every team's VCDB, Net
 * FTE, FTE rank, factor and Final Score in one table, Zwolle highlighted.
 * Official values only; projections live in ZwolleProjectionPanel.
 */
export function StandingsTable({ standings, updatedAt }: StandingsTableProps) {
  const hidden = hiddenNetFteRanks(standings);

  return (
    <section className="panel p-5 sm:p-7" aria-labelledby="standings-table">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-classified">Ranking · Net FTE-bril</p>
          <h2 id="standings-table" className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-ink">
            Eindstand
          </h2>
        </div>
        <StandBadge kind="official" detail={`Power BI ${formatPowerBiTime(updatedAt)}`} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {HEADERS.map((h) => (
                <th key={h.label} scope="col" className={`px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim ${h.className}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const own = row.team === OWN_TEAM;
              return (
                <tr
                  key={row.team}
                  aria-current={own ? 'true' : undefined}
                  className={`border-b border-white/[0.045] tabular-nums last:border-b-0 ${own ? 'bg-gold/[0.09] font-semibold text-ink shadow-[inset_2px_0_0_0_#D6AE55]' : 'text-ink/85'}`}
                >
                  <td className={`px-3 py-2.5 font-display text-base font-bold ${own || row.finalRanking === 1 ? 'text-gold' : 'text-ink-muted'}`}>{row.finalRanking}</td>
                  <td className={`px-3 py-2.5 ${own ? 'text-gold' : ''}`}>{row.team}</td>
                  <td className="px-3 py-2.5 text-right">{formatVcdbValue(row.vcdbScore)}</td>
                  <td className={`px-3 py-2.5 text-right ${row.netFte >= 0 ? 'text-status-go' : ''}`}>{formatVcdbValue(row.netFte)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-muted">#{row.netFteRanking}</td>
                  <td className="px-3 py-2.5 text-right">{formatFactor(row.factor)}</td>
                  <td className={`px-3 py-2.5 text-right font-display text-base font-bold ${own ? 'text-gold' : 'text-ink'}`}>{formatVcdbValue(row.finalScore)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hidden.length > 0 && (
        <p className="mt-2 text-[11px] text-ink-dim">
          Net FTE-rang {hidden.map((r) => `#${r}`).join(', ')} hoort bij een team dat niet in de eindstand staat.
        </p>
      )}
    </section>
  );
}
