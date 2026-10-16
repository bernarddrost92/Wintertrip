import { useMemo, useState } from 'react';
import { ArrowUpRight, FileSignature, RefreshCw, Ticket, UserPlus } from 'lucide-react';
import { CommandFrame } from '../../components/CommandFrame';
import { SoftDivider } from '../../components/SoftDivider';
import { softAssetUrl } from '../../components/softAssets';
import { StandBadge } from '../../components/StandBadge';
import { StatTile } from '../../components/StatTile';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import type { FteBon } from '../../services/fteBonnen';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { hiddenNetFteRanks, projectStandings } from '../../services/netFteProjection';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';
import { FactorLadder } from './FactorLadder';
import { FteBonCalculator } from './FteBonCalculator';
import { FteBonReceiptDialog } from './FteBonReceiptDialog';
import { MeasurementDates } from './MeasurementDates';
import { OpenBonnenPanel } from './OpenBonnenPanel';

/** The four FTE actions to focus on — presentation labels only; the bon
 * types themselves live in services/fteBonnen.ts. */
const FOCUS = [
  { label: 'Verlengen', icon: RefreshCw },
  { label: 'PO → contract', icon: FileSignature },
  { label: 'Nieuwe contractant', icon: UserPlus },
  { label: 'Uren ophogen', icon: ArrowUpRight },
];

/**
 * Net FTE — the FTE mission toward January, in three levels:
 * 1. mission: the rule (Net FTE = BPT + VD, PO telt niet mee) with the four
 *    focus actions, the measurement period, the official Net FTE stand
 *    (Power BI snapshot) and the projection with every open bon;
 * 2. action: the FTE Bon Calculator;
 * 3. support: the shared open bonnen and the FTE-ladder.
 * The rule is presentation only — bon types and maths are unchanged.
 * Uses the Net FTE values exactly as the current standings show them.
 */
export function NetFtePage() {
  const { standings, updatedAt } = getMissionSnapshot();
  const bonnen = useFteBonnen();
  const own = standings.find((row) => row.team === OWN_TEAM)!;
  const netFteTeamCount = standings.length + hiddenNetFteRanks(standings).length;
  const projection = useMemo(() => projectStandings(standings, OWN_TEAM, bonnen.openFte), [standings, bonnen.openFte]);
  const [receiptBon, setReceiptBon] = useState<FteBon | null>(null);
  const officialDate = formatPowerBiTime(updatedAt);

  return (
    <CommandFrame>
      <div className="space-y-7 p-4 sm:space-y-8 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-classified">007 · Missie Net FTE</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Net FTE</h1>
          </div>
          <StandBadge kind="official" detail={`Power BI ${officialDate}`} />
        </header>

        {/* Level 1 — the rule, the measurement period, where we stand. */}
        <section aria-label="Net FTE missie" className="space-y-5">
          <div className="panel mission-accent-line relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
            <img src={softAssetUrl('soft-crosshair')} alt="" aria-hidden className="soft-asset -right-8 -top-8 hidden w-40 opacity-[0.14] lg:block" />
            <p className="label-classified">De regel</p>
            <p className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight text-gold sm:text-6xl">
              Net FTE = <span className="whitespace-nowrap">BPT + VD</span>
            </p>
            <p className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">PO telt niet mee.</p>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
              Zet PO waar mogelijk om naar contract en bouw zoveel mogelijk contract-FTE richting 31 januari.
            </p>
            <div className="mt-4">
              <p className="label-classified">Hoe pakken we FTE?</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FOCUS.map(({ label, icon: Icon }) => (
                  <li key={label} className="flex items-center gap-2 border border-white/[0.08] bg-mission-panel px-3 py-2 text-sm font-semibold text-ink">
                    <Icon size={15} className="shrink-0 text-gold" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-xl">
              Meetperiode: 1 sep → 31 jan
            </p>
            <p className="text-sm text-ink-muted">We vergelijken de contract-FTE op beide meetmomenten.</p>
            <div className="mt-3">
              <MeasurementDates />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border border-white/[0.07] bg-white/[0.05] lg:grid-cols-4">
            <StatTile label="Officiële Net FTE" value={formatVcdbValue(own.netFte)} tone="gold" sub="Zwolle" />
            <StatTile label="FTE-ranking" value={`#${own.netFteRanking}`} sub={`van ${netFteTeamCount} teams`} />
            <StatTile label="Factor" value={formatFactor(own.factor)} sub="over de hele VCDB" />
            <StatTile label="Eindstand" value={`#${own.finalRanking}`} sub={`Final Score ${formatVcdbValue(own.finalScore)}`} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-dashed border-intel/35 bg-intel/[0.04] px-4 py-3">
            <StandBadge kind="projection" detail={bonnen.status === 'ready' ? `${formatSignedFte(bonnen.openFte)} FTE open bonnen` : 'open bonnen niet geladen'} />
            <p className="text-sm text-ink-muted">
              Met alle open bonnen:{' '}
              <span className="font-display text-lg font-bold tabular-nums text-intel">{formatVcdbValue(projection.own.netFte)}</span>
              <span className="text-ink-dim"> · </span>
              <span className="font-semibold text-intel">FTE #{projection.own.netFteRanking}</span>
              <span className="text-ink-dim"> · </span>
              <span className="font-semibold text-intel">{formatFactor(projection.own.factor)}</span>
              <span className="text-ink-dim"> · </span>
              <span className="font-semibold text-intel">positie #{projection.own.finalRanking}</span>
            </p>
            <a
              href="#fte-bon-calculator"
              className="ml-auto inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-mission-deep transition-colors hover:bg-gold-bright"
            >
              <Ticket size={14} aria-hidden />
              Pak FTE-bon
            </a>
          </div>
        </section>

        <SoftDivider />

        {/* Level 2 — the action. */}
        <FteBonCalculator standings={standings} openFte={bonnen.openFte} storeStatus={bonnen.status} saving={bonnen.saving} onSave={bonnen.add} onPrintReceipt={setReceiptBon} />

        {/* Level 3 — support. */}
        <div className="space-y-6">
          <OpenBonnenPanel
            status={bonnen.status}
            bonnen={bonnen.bonnen}
            openFte={bonnen.openFte}
            projection={projection}
            onRealize={bonnen.markRealized}
            onReopen={bonnen.reopen}
            onRemove={bonnen.remove}
            onReceipt={setReceiptBon}
          />

          <FactorLadder standings={standings} baseFte={bonnen.openFte} />
        </div>
      </div>

      {receiptBon && (
        <FteBonReceiptDialog
          bon={receiptBon}
          standings={standings}
          openFte={bonnen.openFte}
          officialDate={officialDate}
          onClose={() => setReceiptBon(null)}
        />
      )}
    </CommandFrame>
  );
}
