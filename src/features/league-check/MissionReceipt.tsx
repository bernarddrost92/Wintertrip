import { forwardRef } from 'react';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { getQualifyingTermRange } from '../calculator/computeResult';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatFactor, formatFoundPoints, formatVcdbValue } from '../../utils/format';
import type { AfterCheckOutput } from './useAfterCheck';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { MissionType } from '../../types/league';

export interface ReceiptCardProps {
  beforeCheck: BeforeCheckSnapshot;
  afterCheck: AfterCheckOutput;
  agent: AgentIdentity;
  checkedCount: number;
  total: number;
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
  return <div className="border-t border-dashed border-gold/20" aria-hidden />;
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
 * The receipt card itself — a premium intelligence-report panel, not a
 * physical kassabon replica: a flat black/graphite fill with a single thin
 * gold hairline border and a soft ambient glow, no perforated edges or
 * decorative cutouts. Shared verbatim by the on-screen MissionReceipt and
 * the off-screen export node ReceiptActions renders for the PNG, so the
 * two can never drift apart visually.
 */
export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(function ReceiptCard(
  { beforeCheck, afterCheck, agent, checkedCount, total },
  ref,
) {
  const term = getQualifyingTermRange(afterCheck.form);
  const vcdb = vcdbFieldFor(afterCheck.form);

  return (
    <div
      ref={ref}
      className="relative border border-gold/25"
      style={{
        background: 'linear-gradient(180deg, #0d1013 0%, #060708 100%)',
        boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7), 0 0 44px -14px rgba(255,215,104,0.12)',
      }}
    >
      <div className="space-y-4 px-6 py-7 font-mono">
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Team Zwolle</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Operatie Wintersport 2027</p>
          <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.14em] text-gold drop-shadow-[0_0_18px_rgba(255,215,104,0.4)]">
            Mission Receipt
          </p>
        </div>

        <ReceiptDivider />

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Agent</p>
            <p className="mt-0.5 break-words text-base font-semibold text-ink">
              {agent.agentName || '—'} <span className="text-sm font-normal text-ink-muted">· {agent.agentRole}</span>
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Professional</p>
            <p className="mt-0.5 break-words text-base font-semibold text-ink">{agent.professionalName || '—'}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Mission Status</span>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold">
              Approved <span className="text-ink-muted">{checkedCount}/{total}</span>
            </span>
          </div>
        </div>

        <ReceiptDivider />

        <div className="space-y-1.5">
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

        {/* Hero #1 — the whole point of the receipt: what did the check find. */}
        <div className="space-y-1 py-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Punten Gevonden</p>
          <p className="font-display text-4xl font-bold tabular-nums text-gold drop-shadow-[0_0_20px_rgba(255,215,104,0.4)]">
            {formatFoundPoints(afterCheck.found.foundLeaguePoints)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">League Points</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-xs tabular-nums text-ink-muted">
            <span>{formatVcdbValue(beforeCheck.result.finalScore)}</span>
            <span className="text-gold/60">→</span>
            <span className="font-semibold text-ink">{formatVcdbValue(afterCheck.result.finalScore)}</span>
          </p>
        </div>

        <ReceiptDivider />

        {/* Hero #2 — the resulting end value, secondary to Punten Gevonden but still a clear standalone result. */}
        <div className="space-y-1 py-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Final Mission Value</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-ink">
            {formatVcdbValue(afterCheck.result.finalScore)} <span className="text-sm font-normal text-ink-muted">points</span>
          </p>
        </div>

        <ReceiptDivider />

        <div className="space-y-1.5">
          <ReceiptRow label="Base Points Found" value={formatFoundPoints(afterCheck.found.foundBasePoints)} />
          <ReceiptRow label="Factor Boost" value={`× ${afterCheck.form.factor.toLocaleString('nl-NL')}`} />
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
 * The Mission Receipt — a premium 007-style intelligence receipt printed
 * the moment a League Check closes 6/6, laying BEFORE and AFTER side by
 * side so the commercial improvement the check itself surfaced is
 * unmistakable. Found points come straight from services/missionReceipt.ts:
 * a pure Base Score delta, never inflated by a Factor change alone.
 *
 * Forwards its ref straight to the ReceiptCard root — ReceiptActions reads
 * that same node to generate the downloaded/shared PNG, so the exported
 * image is always pixel-identical to what's on screen, not a separate copy.
 */
export const MissionReceipt = forwardRef<HTMLDivElement, MissionReceiptProps>(function MissionReceipt(props, ref) {
  return (
    <div className="relative mx-auto max-w-[520px] py-3">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 opacity-60"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(255,215,104,0.14), transparent 72%)' }}
        aria-hidden
      />
      <ReceiptCard ref={ref} {...props} />
    </div>
  );
});
