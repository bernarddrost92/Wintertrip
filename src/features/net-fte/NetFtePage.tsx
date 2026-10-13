import { useMemo, useState } from 'react';
import { CalendarClock, FileSignature, RefreshCw, UserPlus } from 'lucide-react';
import { CommandFrame } from '../../components/CommandFrame';
import { StandBadge } from '../../components/StandBadge';
import { StatTile } from '../../components/StatTile';
import { OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { useFteBonnen } from '../../hooks/useFteBonnen';
import type { FteBon } from '../../services/fteBonnen';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { hiddenNetFteRanks, projectStandings } from '../../services/netFteProjection';
import { formatFactor, formatVcdbValue } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';
import { FactorLadder } from './FactorLadder';
import { FteBonCalculator } from './FteBonCalculator';
import { FteBonReceiptDialog } from './FteBonReceiptDialog';
import { OpenBonnenPanel } from './OpenBonnenPanel';

const FOCUS = [
  { label: 'Verlengingen', icon: RefreshCw },
  { label: 'PO → contract', icon: FileSignature },
  { label: 'BPT verlengen', icon: CalendarClock },
  { label: 'Nieuwe contractanten', icon: UserPlus },
];

/**
 * Net FTE — the FTE mission toward January. The official Net FTE stand
 * (Power BI snapshot) on top, then the FTE Bon Calculator, the shared open
 * bonnen with their projection, and the FTE-ladder. Uses the Net FTE values
 * exactly as the current standings show them.
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
      <div className="space-y-5 p-4 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-classified">007 · Missie Net FTE</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Net FTE</h1>
          </div>
          <StandBadge kind="official" detail={`Power BI ${officialDate}`} />
        </header>

        <div className="grid grid-cols-2 gap-px border border-gold/20 bg-gold/10 lg:grid-cols-4">
          <StatTile label="Officiële Net FTE" value={formatVcdbValue(own.netFte)} tone="gold" sub="Zwolle" />
          <StatTile label="FTE-ranking" value={`#${own.netFteRanking}`} sub={`van ${netFteTeamCount} teams`} />
          <StatTile label="Factor" value={formatFactor(own.factor)} sub="over de hele VCDB" />
          <StatTile label="Eindstand" value={`#${own.finalRanking}`} sub={`Final Score ${formatVcdbValue(own.finalScore)}`} />
        </div>

        <div className="border border-gold/20 bg-gold/5 px-4 py-4 sm:px-5">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-xl">
            September vs januari: de totale FTE van onze contractanten beslist.
          </p>
          <p className="mt-1 text-sm text-ink-muted">Elke FTE die we vasthouden of erbij halen, telt in de factor over al onze punten. Volle focus op:</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FOCUS.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2 border border-white/10 bg-mission-panel px-3 py-2 text-sm font-semibold text-ink">
                <Icon size={15} className="shrink-0 text-gold" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <FteBonCalculator standings={standings} openFte={bonnen.openFte} storeStatus={bonnen.status} saving={bonnen.saving} onSave={bonnen.add} onPrintReceipt={setReceiptBon} />

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
