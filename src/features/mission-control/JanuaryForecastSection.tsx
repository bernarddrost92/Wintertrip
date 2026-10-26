import { StandBadge } from '../../components/StandBadge';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import type { JanuaryForecast } from '../../data/januaryForecast';
import { forecastStandings } from '../../services/januaryForecast';
import { formatIsoDateNl } from '../../utils/dates';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';

interface JanuaryForecastSectionProps {
  forecast: JanuaryForecast;
  standings: PowerBiStandingRow[];
}

const HEADERS = [
  { label: '#', className: 'w-10 text-left' },
  { label: 'Team', className: 'text-left' },
  { label: 'FTE 1 sep', className: 'text-right' },
  { label: 'FTE 31 jan', className: 'text-right' },
  { label: 'Net FTE', className: 'text-right' },
  { label: 'Factor', className: 'text-right' },
  { label: 'Final Score', className: 'text-right' },
  { label: 'Positie', className: 'text-right' },
];

/**
 * The forecast for the measurement date: Net FTE per vestiging by contract
 * vestiging (1 Sep vs 31 Jan, from the weekly contract export), the factor
 * each forecast rank earns, and the Final Score that gives on today's
 * official VCDB. Always marked as a projection, separate from the official
 * table above it.
 */
export function JanuaryForecastSection({ forecast, standings }: JanuaryForecastSectionProps) {
  const rows = forecastStandings(forecast.teams, standings);
  const own = rows.find((r) => r.team === OWN_TEAM);

  return (
    <section className="panel border-intel/25 p-5 sm:p-7" aria-labelledby="january-forecast">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="january-forecast" className="font-display text-2xl font-black uppercase tracking-tight text-ink">
          Net FTE per 31 januari
        </h2>
        <StandBadge kind="projection" detail={`contractenlijst ${formatIsoDateNl(forecast.calculatedAt)}`} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Uit de contractenlijst van alle vestigingen: BPT/VD-contracten die op {formatIsoDateNl(forecast.measureDate)} lopen, min de stand van{' '}
        {formatIsoDateNl(forecast.baselineDate)}. Power BI laat alleen de stand van vandaag zien. Final Score = VCDB van vandaag × de factor van die plek.
      </p>

      {own && (
        <p className="mt-4 border-l-2 border-intel bg-intel/10 px-4 py-3 text-[15px] text-ink" data-testid="forecast-own">
          Zwolle: <span className="font-semibold text-intel">{formatSignedFte(own.netFte)} FTE</span> → Net FTE #{own.netFteRanking} → factor{' '}
          {formatFactor(own.factor)} → <span className="font-semibold text-intel">{formatVcdbValue(own.finalScore)}</span> → positie #{own.finalRanking}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {HEADERS.map((h) => (
                <th key={h.label} scope="col" className={`px-3 py-2.5 text-[12px] font-semibold text-ink-muted ${h.className}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOwn = row.team === OWN_TEAM;
              return (
                <tr
                  key={row.team}
                  className={`border-b border-white/[0.045] tabular-nums last:border-b-0 ${isOwn ? 'bg-intel/[0.1] font-semibold text-ink shadow-[inset_2px_0_0_0_#8CC2E6]' : 'text-ink/85'}`}
                >
                  <td className="px-3 py-2.5 text-left font-display text-base font-bold">{row.netFteRanking}</td>
                  <td className="px-3 py-2.5 text-left">{row.team}</td>
                  <td className="px-3 py-2.5 text-right">{formatVcdbValue(row.fteBaseline)}</td>
                  <td className="px-3 py-2.5 text-right">{formatVcdbValue(row.fteMeasure)}</td>
                  <td className={`px-3 py-2.5 text-right ${row.netFte >= 0 ? 'text-status-go' : ''}`}>{formatSignedFte(row.netFte)}</td>
                  <td className="px-3 py-2.5 text-right">{formatFactor(row.factor)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{formatVcdbValue(row.finalScore)}</td>
                  <td className="px-3 py-2.5 text-right">#{row.finalRanking}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-ink-muted">
        Telt alle contracten die in de lijst van deze week staan; nieuwe contracten en verlengingen verschijnen in de volgende lijst. PO telt niet mee. Power BI kent nog
        een twaalfde Net FTE-plek voor een team dat hier niet in staat.
      </p>
    </section>
  );
}
