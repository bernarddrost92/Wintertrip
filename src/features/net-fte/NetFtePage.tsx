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
import { hiddenNetFteRanks, nextNetFteTarget, projectStandings } from '../../services/netFteProjection';
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
  const target = nextNetFteTarget(projection);
  const [receiptBon, setReceiptBon] = useState<FteBon | null>(null);
  const officialDate = formatPowerBiTime(updatedAt);

  return (
    <CommandFrame>
      <div className="space-y-7 p-4 sm:space-y-8 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Net FTE</h1>
          <StandBadge kind="official" detail={`Power BI ${officialDate}`} />
        </header>

        {/* The rule → where we stand → PAK FTE-BON; the dates under that. */}
        <section aria-label="Net FTE missie" className="space-y-4">
          <div className="panel mission-accent-line relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6">
            <img src={softAssetUrl('soft-crosshair')} alt="" aria-hidden className="soft-asset -right-8 -top-8 hidden w-40 opacity-[0.14] lg:block" />
            <p className="font-display text-4xl font-black uppercase leading-none tracking-tight text-gold sm:text-6xl">
              Net FTE = <span className="whitespace-nowrap">BPT + VD</span>
            </p>
            <p className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">PO telt niet mee.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Hoe pakken we FTE?">
              {FOCUS.map(({ label, icon: Icon }) => (
                <li key={label} className="flex min-h-11 items-center gap-2 border border-white/[0.08] bg-mission-panel px-3 py-2 text-[15px] font-semibold text-ink">
                  <Icon size={16} className="shrink-0 text-gold" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-px border border-white/[0.07] bg-white/[0.05] lg:grid-cols-4">
            <StatTile label="Officiële Net FTE" value={formatVcdbValue(own.netFte)} tone="gold" sub="Zwolle" />
            <StatTile label="FTE-ranking" value={`#${own.netFteRanking}`} sub={`van ${netFteTeamCount} teams`} />
            <StatTile label="Factor" value={formatFactor(own.factor)} sub="over de hele VCDB" />
            <StatTile
              label="Volgende target"
              value={target ? `#${target.rank} ${target.team}` : '#1'}
              sub={target ? `${formatSignedFte(target.fteNeeded)} FTE nodig` : 'vasthouden'}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-dashed border-intel/35 bg-intel/[0.04] px-4 py-3">
            <StandBadge kind="projection" detail={bonnen.status === 'ready' ? `${formatSignedFte(bonnen.openFte)} FTE open bonnen` : 'open bonnen niet geladen'} />
            <p className="text-[15px] text-ink-muted">
              Met open bonnen:{' '}
              <span className="font-display text-lg font-bold tabular-nums text-intel">{formatVcdbValue(projection.own.netFte)}</span>
              <span className="text-ink-dim"> · </span>
              <span className="font-semibold text-intel">FTE #{projection.own.netFteRanking}</span>
              <span className="text-ink-dim"> · </span>
              <span className="font-semibold text-intel">{formatFactor(projection.own.factor)}</span>
            </p>
            <a
              href="#fte-bon-calculator"
              className="ml-auto inline-flex min-h-11 items-center gap-2 bg-gold px-5 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-mission-deep transition-colors hover:bg-gold-bright"
            >
              <Ticket size={16} aria-hidden />
              Pak FTE-bon
            </a>
          </div>

          <MeasurementDates />
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
