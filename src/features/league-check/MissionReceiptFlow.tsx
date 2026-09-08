import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { formatFoundPoints, formatVcdbValue } from '../../utils/format';
import { AfterCheckEditor } from './AfterCheckEditor';
import { MissionReceipt } from './MissionReceipt';
import { ReceiptActions } from './ReceiptActions';
import { useAfterCheck } from './useAfterCheck';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

interface MissionReceiptFlowProps {
  /** Null when the League Check is being run standalone, without ever
   * going through the Mission Calculator — the GENERATE RECEIPT button and
   * everything it produces still work, there is just no scored Mission
   * Value to show or edit. */
  beforeCheck: BeforeCheckSnapshot | null;
  agent: AgentIdentity;
  checkedItems: Record<string, boolean>;
  checkedCount: number;
  total: number;
}

function GenerateReceiptButton({ missionApproved, onClick }: { missionApproved: boolean; onClick: () => void }) {
  return (
    <GoldButton onClick={onClick} icon={<Sparkles size={16} />}>
      {missionApproved ? 'Mission Approved — View Receipt' : 'Generate Receipt'}
    </GoldButton>
  );
}

/**
 * A Mission Receipt is available at any checked count — 6/6 only changes
 * the status it prints, it was never a requirement to generate one. This
 * component branches on whether a Calculator session (BeforeCheckSnapshot)
 * exists at all: with one, the existing After Check editor and Base
 * Score/Mission Value/Found Points panel are shown exactly as before; without
 * one, League Check runs fully standalone and the receipt prints with
 * "Mission Value — Pending Calculation" instead of a fabricated score.
 */
export function MissionReceiptFlow({ beforeCheck, agent, checkedItems, checkedCount, total }: MissionReceiptFlowProps) {
  if (beforeCheck) {
    return (
      <MissionReceiptFlowWithCalculator beforeCheck={beforeCheck} agent={agent} checkedItems={checkedItems} checkedCount={checkedCount} total={total} />
    );
  }
  return <MissionReceiptFlowStandalone agent={agent} checkedItems={checkedItems} checkedCount={checkedCount} total={total} />;
}

interface WithCalculatorProps {
  beforeCheck: BeforeCheckSnapshot;
  agent: AgentIdentity;
  checkedItems: Record<string, boolean>;
  checkedCount: number;
  total: number;
}

function MissionReceiptFlowWithCalculator({ beforeCheck, agent, checkedItems, checkedCount, total }: WithCalculatorProps) {
  const afterCheck = useAfterCheck(beforeCheck);
  const missionApproved = checkedCount === total;
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-5 sm:p-6">
        <p className="label-classified mb-4 text-gold">After Check</p>
        <AfterCheckEditor afterCheck={afterCheck} />

        <div className="mt-6 grid grid-cols-2 gap-px border border-gold/15 bg-gold/10 sm:grid-cols-3">
          <div className="bg-mission-panel px-4 py-4 text-center">
            <p className="label-classified">Base Score</p>
            <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-ink">{formatVcdbValue(afterCheck.result.baseScore)}</p>
          </div>
          <div className="bg-mission-panel px-4 py-4 text-center">
            <p className="label-classified">Mission Value</p>
            <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-ink">{formatVcdbValue(afterCheck.result.finalScore)}</p>
          </div>
          <div className="col-span-2 bg-mission-panel px-4 py-4 text-center sm:col-span-1">
            <p className="label-classified">Gevonden Winst</p>
            <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-gold">{formatFoundPoints(afterCheck.found.foundLeaguePoints)}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GenerateReceiptButton missionApproved={missionApproved} onClick={() => setReceiptGenerated(true)} />
        </div>
      </div>

      {receiptGenerated && (
        <>
          <MissionReceipt
            ref={receiptRef}
            beforeCheck={beforeCheck}
            afterCheck={afterCheck}
            agent={agent}
            checkedItems={checkedItems}
            checkedCount={checkedCount}
            total={total}
          />
          <ReceiptActions
            receiptRef={receiptRef}
            beforeCheck={beforeCheck}
            afterCheck={afterCheck}
            agent={agent}
            checkedItems={checkedItems}
            checkedCount={checkedCount}
            total={total}
          />
        </>
      )}
    </div>
  );
}

interface StandaloneProps {
  agent: AgentIdentity;
  checkedItems: Record<string, boolean>;
  checkedCount: number;
  total: number;
}

/** League Check run entirely on its own, with no Calculator session behind
 * it — no After Check editor (there is no Before form to compare against),
 * no found points, just Agent/Professional/checklist status printed as-is. */
function MissionReceiptFlowStandalone({ agent, checkedItems, checkedCount, total }: StandaloneProps) {
  const missionApproved = checkedCount === total;
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-5 py-6 text-center sm:p-6">
        <p className="label-classified mb-2 text-gold">Mission Value</p>
        <p className="font-display text-lg font-semibold uppercase tracking-wide text-ink-muted">Pending Calculation</p>
        <p className="mt-2 text-xs text-ink-muted">Geen Calculator-sessie gekoppeld — de receipt toont géén score.</p>

        <div className="mt-6 flex justify-center">
          <GenerateReceiptButton missionApproved={missionApproved} onClick={() => setReceiptGenerated(true)} />
        </div>
      </div>

      {receiptGenerated && (
        <>
          <MissionReceipt
            ref={receiptRef}
            beforeCheck={null}
            afterCheck={null}
            agent={agent}
            checkedItems={checkedItems}
            checkedCount={checkedCount}
            total={total}
          />
          <ReceiptActions
            receiptRef={receiptRef}
            beforeCheck={null}
            afterCheck={null}
            agent={agent}
            checkedItems={checkedItems}
            checkedCount={checkedCount}
            total={total}
          />
        </>
      )}
    </div>
  );
}
