import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { formatFoundPoints, formatVcdbValue } from '../../utils/format';
import { AfterCheckEditor } from './AfterCheckEditor';
import { MissionReceipt } from './MissionReceipt';
import { ReceiptActions } from './ReceiptActions';
import { useAfterCheck } from './useAfterCheck';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';

interface AfterCheckFlowProps {
  beforeCheck: BeforeCheckSnapshot;
  agent: AgentIdentity;
  checkedCount: number;
  total: number;
}

/**
 * Only mounted once the League Check itself is 6/6 — "did the check turn
 * up any real commercial improvement?" It's fine if the answer is no: a
 * NO CHANGE deal still generates a receipt, with +0.00 found points, which
 * the spec explicitly treats as a fully valid outcome.
 */
export function AfterCheckFlow({ beforeCheck, agent, checkedCount, total }: AfterCheckFlowProps) {
  const afterCheck = useAfterCheck(beforeCheck);
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 space-y-6">
      <div className="border border-gold bg-gold/5 px-6 py-6 text-center shadow-gold-lg">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-gold">Mission Check Complete</p>
        <p className="mt-2 text-sm text-ink-muted">Heb je punten gevonden?</p>
      </div>

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
          <GoldButton onClick={() => setReceiptGenerated(true)} icon={<Sparkles size={16} />}>
            Genereer Mission Receipt
          </GoldButton>
        </div>
      </div>

      {receiptGenerated && (
        <>
          <MissionReceipt ref={receiptRef} beforeCheck={beforeCheck} afterCheck={afterCheck} agent={agent} checkedCount={checkedCount} total={total} />
          <ReceiptActions
            receiptRef={receiptRef}
            beforeCheck={beforeCheck}
            afterCheck={afterCheck}
            agent={agent}
            checkedCount={checkedCount}
            total={total}
          />
        </>
      )}
    </div>
  );
}
