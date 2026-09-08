import { forwardRef } from 'react';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { getQualifyingTermRange } from '../calculator/computeResult';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatFactor, formatFoundPoints, formatVcdbValue } from '../../utils/format';
import type { AfterCheckOutput } from './useAfterCheck';
import type { BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { MissionType } from '../../types/league';

export interface ReceiptCardProps {
  beforeCheck: BeforeCheckSnapshot;
  afterCheck: AfterCheckOutput;
  professional: string;
  checkedCount: number;
  total: number;
  /** Strips the Professional row — used for the shareable/downloadable PNG,
   * which carries no personal data by default. The on-screen receipt keeps
   * showing it. */
  redactPersonal?: boolean;
}

type MissionReceiptProps = ReceiptCardProps;

const MISSION_TYPE_LABEL: Record<MissionType, string> = {
  NEW_PLACEMENT: 'NIEUWE PLAATSING',
  EXTENSION: 'VERLENGING',
  HOURS_INCREASE: 'URENUITBREIDING',
};

function vcdbFieldFor(form: CalculatorForm): string {
  if (form.missionType === 'NEW_PLACEMENT') return form.vcdbPerMonth;
  if (form.missionType === 'EXTENSION') return form.extensionVcdbPerMonth;
  return form.extraVcdbPerMonth;
}

/** A row of small punched-through holes along one edge of the receipt —
 * colored to match the card's own opaque fill so they read as real
 * perforation, whatever sits behind the page. */
function PerforatedEdge({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 flex justify-between px-1.5 ${position === 'top' ? '-top-[5px]' : '-bottom-[5px]'}`}
      aria-hidden
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: '#08090b' }} />
      ))}
    </div>
  );
}

const BARCODE_PATTERN = [2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 1, 2, 3, 1, 1, 2, 1, 4, 2, 1, 1, 3, 1, 2, 1, 1, 4, 2, 1, 1, 3, 2, 1, 1];

function ReceiptBarcode() {
  return (
    <div className="flex h-8 items-stretch gap-[2px]" aria-hidden>
      {BARCODE_PATTERN.map((w, i) => (
        <span key={i} className={`bg-gold/70 ${i % 5 === 0 ? 'opacity-90' : 'opacity-60'}`} style={{ width: `${w * 2}px` }} />
      ))}
    </div>
  );
}

function ReceiptDivider() {
  return <div className="border-t border-dashed border-gold/25" aria-hidden />;
}

function ReceiptRow({ label, value, valueClassName = 'text-ink' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11px]">
      <span className="uppercase tracking-wider text-ink-muted">{label}</span>
      <span className={`font-semibold tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  );
}

/**
 * The bordered kassabon itself — perforated edges, all receipt content,
 * nothing else. Shared verbatim by the on-screen MissionReceipt (wrapped in
 * its ambient glow) and the off-screen export node ReceiptActions renders
 * to produce the shareable/downloadable PNG, so the two can never drift
 * apart visually.
 */
export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(function ReceiptCard(
  { beforeCheck, afterCheck, professional, checkedCount, total, redactPersonal = false },
  ref,
) {
  const term = getQualifyingTermRange(afterCheck.form);
  const vcdb = vcdbFieldFor(afterCheck.form);

  return (
    <div
      ref={ref}
      className="panel relative shadow-gold-lg"
      style={{ background: 'linear-gradient(180deg, #0b0e12 0%, #08090b 60%, #06080a 100%)' }}
    >
      <PerforatedEdge position="top" />
      <PerforatedEdge position="bottom" />

        <div className="space-y-4 px-6 py-7 font-mono">
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Team Zwolle</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Operatie Wintersport 2027</p>
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.14em] text-gold drop-shadow-[0_0_18px_rgba(255,215,104,0.4)]">
              Mission Receipt
            </p>
          </div>

          <ReceiptDivider />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Mission Status</span>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold">
              Approved <span className="text-ink-muted">{checkedCount}/{total}</span>
            </span>
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            {!redactPersonal && professional && <ReceiptRow label="Professional" value={professional} />}
            <ReceiptRow label="Mission Type" value={MISSION_TYPE_LABEL[afterCheck.form.missionType]} />
          </div>

          {term && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Qualifying Term</p>
              <p className="text-sm font-semibold tabular-nums text-ink">{formatIsoDateReceipt(term.start)}</p>
              <p className="text-sm font-semibold tabular-nums text-ink">{formatIsoDateReceipt(term.end)}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <ReceiptRow label="VCDB / Month" value={formatVcdbValue(Number(vcdb.replace(',', '.')) || 0)} />
            <ReceiptRow label="Factor" value={formatFactor(afterCheck.form.factor)} />
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Before League Check</p>
            <ReceiptRow label="Base Score" value={formatVcdbValue(beforeCheck.result.baseScore)} />
            <ReceiptRow label="Mission Value" value={formatVcdbValue(beforeCheck.result.finalScore)} />
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">After League Check</p>
            <ReceiptRow label="Base Score" value={formatVcdbValue(afterCheck.result.baseScore)} />
            <ReceiptRow label="Mission Value" value={formatVcdbValue(afterCheck.result.finalScore)} />
          </div>

          <ReceiptDivider />

          <div className="space-y-1 py-1 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Punten Gevonden</p>
            <p className="font-display text-4xl font-bold tabular-nums text-gold drop-shadow-[0_0_22px_rgba(255,215,104,0.45)]">
              {formatFoundPoints(afterCheck.found.foundLeaguePoints)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">League Points</p>
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            <ReceiptRow label="Base Points Found" value={formatFoundPoints(afterCheck.found.foundBasePoints)} valueClassName="text-gold" />
            <ReceiptRow label="Factor Boost" value={`× ${afterCheck.form.factor.toLocaleString('nl-NL')}`} />
            <ReceiptRow label="Final Mission Value" value={formatVcdbValue(afterCheck.result.finalScore)} valueClassName="text-gold" />
          </div>

          <ReceiptDivider />

          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {LEAGUE_CHECK_ITEMS.map((item) => (
              <li key={item.id} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink">
                <span className="text-gold">✓</span>
                {item.code.replace(/^\d+\s*/, '')}
              </li>
            ))}
          </ul>

          <ReceiptDivider />

          <div className="space-y-1 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">2 Paar Ogen</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">0 Punten Laten Liggen</p>
          </div>

        <div className="flex justify-center pt-2">
          <ReceiptBarcode />
        </div>
        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-ink-dim">WS27-2609-ZWL</p>
      </div>
    </div>
  );
});

/**
 * The Mission Receipt — a premium black/gold "kassabon" printed the moment
 * a League Check closes 6/6, laying BEFORE and AFTER side by side so the
 * commercial improvement the check itself surfaced is unmistakable. Found
 * points come straight from services/missionReceipt.ts: a pure Base Score
 * delta, never inflated by a Factor change alone.
 */
export function MissionReceipt(props: MissionReceiptProps) {
  return (
    <div className="relative mx-auto max-w-[420px] py-3">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 opacity-80"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(255,215,104,0.16), transparent 72%)' }}
        aria-hidden
      />
      <ReceiptCard {...props} />
    </div>
  );
}
