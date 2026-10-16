import { Crosshair, Target } from 'lucide-react';
import { StandBadge } from '../../components/StandBadge';
import { LEAGUE_PERIOD } from '../../config/leagueRules';
import { formatIsoDateNl } from '../../utils/dates';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import { nextFinalRankingTarget, nextNetFteTarget, projectStandings } from '../../services/netFteProjection';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';

interface ZwolleProjectionPanelProps {
  standings: PowerBiStandingRow[];
}

interface Figures {
  netFte: number;
  netFteRanking: number;
  factor: number;
  finalScore: number;
  finalRanking: number;
}

function FigureColumn({ kind, detail, figures }: { kind: 'official' | 'projection'; detail?: string; figures: Figures }) {
  const tone = kind === 'official' ? 'text-ink' : 'text-intel';
  const items = [
    { label: 'Positie', value: `#${figures.finalRanking}` },
    { label: 'Final Score', value: formatVcdbValue(figures.finalScore) },
    { label: 'Net FTE', value: formatVcdbValue(figures.netFte) },
    { label: 'FTE-rank', value: `#${figures.netFteRanking}` },
    { label: 'Factor', value: formatFactor(figures.factor) },
  ];
  return (
    <div className={`border p-3 ${kind === 'official' ? 'border-gold/25' : 'border-dashed border-intel/50 bg-intel/[0.04]'}`}>
      <StandBadge kind={kind} detail={detail} />
      <dl className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-x-3 gap-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="stat-label">{item.label}</dt>
            <dd className={`font-display text-xl font-bold tabular-nums ${tone}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Zwolle's official stand next to its projection with every open FTE-bon
 * realised — two clearly separate blocks — plus the first team that can be
 * passed in the Final Ranking, via Net FTE or via VCDB.
 */
export function ZwolleProjectionPanel({ standings }: ZwolleProjectionPanelProps) {
  const { status, openBonnen, openFte } = useFteBonnen();
  const projection = projectStandings(standings, OWN_TEAM, openFte);
  const official = projection.own.official;
  const finalTarget = nextFinalRankingTarget(standings, OWN_TEAM, openFte);
  const fteTarget = nextNetFteTarget(projection);

  return (
    <section className="panel p-5 sm:p-7" aria-labelledby="zwolle-projection">
      <h2 id="zwolle-projection" className="font-display text-2xl font-black uppercase tracking-tight text-ink">
        Waar komen we uit?
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Net FTE-meetdatum <span className="font-semibold text-gold">{formatIsoDateNl(LEAGUE_PERIOD.end)}</span> vs {formatIsoDateNl(LEAGUE_PERIOD.start)}
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <FigureColumn kind="official" detail="Power BI" figures={official} />
        <FigureColumn
          kind="projection"
          detail={status === 'ready' ? `${formatSignedFte(openFte)} FTE · ${openBonnen.length} open bonnen` : 'open bonnen niet geladen'}
          figures={projection.own}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="border border-gold/30 bg-gold/5 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
            <Target size={12} aria-hidden /> Eerst te pakken · eindstand
          </p>
          {finalTarget ? (
            <>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                #{finalTarget.finalRanking} {finalTarget.team} <span className="text-base font-semibold text-ink-muted">· −{formatVcdbValue(finalTarget.pointsBehind)}</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {finalTarget.fteRoute && (
                  <li>
                    Via Net FTE: <span className="font-semibold text-gold">{formatSignedFte(finalTarget.fteRoute.fteNeeded)} FTE</span> → factor{' '}
                    {formatFactor(finalTarget.fteRoute.factor)} (FTE #{finalTarget.fteRoute.rank})
                  </li>
                )}
                <li>
                  Via VCDB: <span className="font-semibold text-gold">+{formatVcdbValue(finalTarget.vcdbNeeded)}</span> bij {formatFactor(projection.own.factor)}
                </li>
              </ul>
            </>
          ) : (
            <p className="mt-1 font-display text-xl font-bold text-gold">Zwolle staat #1 — vasthouden.</p>
          )}
        </div>
        <div className="border border-white/10 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
            <Crosshair size={12} aria-hidden /> Volgende in Net FTE
          </p>
          {fteTarget ? (
            <>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                #{fteTarget.rank} {fteTarget.team} <span className="text-base font-semibold text-ink-muted">· {formatVcdbValue(fteTarget.netFte)}</span>
              </p>
              <p className="mt-2 text-sm text-ink">
                Nog <span className="font-semibold text-gold">{formatSignedFte(fteTarget.fteNeeded)} FTE</span> vanaf de projectie.
              </p>
            </>
          ) : (
            <p className="mt-1 font-display text-xl font-bold text-gold">#1 in Net FTE.</p>
          )}
        </div>
      </div>
    </section>
  );
}
