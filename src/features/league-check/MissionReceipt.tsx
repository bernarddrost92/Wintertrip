import { forwardRef } from 'react';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import { getQualifyingTermRange } from '../calculator/computeResult';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatFactor, formatFoundPoints, formatVcdbValue } from '../../utils/format';
import { getDubbelcheckState } from './dubbelcheckStatus';
import type { AfterCheckOutput } from './useAfterCheck';
import type { AgentIdentity, BeforeCheckSnapshot } from '../missionFlow/missionFlowContext';
import type { CalculatorForm } from '../calculator/useMissionControlCalculator';
import type { MissionType } from '../../types/league';

export interface ReceiptCardProps {
  /** Both null when the League Check was run standalone, without ever
   * going through the Mission Calculator — the receipt still prints, just
   * without a scored Mission Value. */
  beforeCheck: BeforeCheckSnapshot | null;
  afterCheck: AfterCheckOutput | null;
  agent: AgentIdentity;
  /** Which of the six checks are ticked — drives the Open Checks list, not
   * just the checkedCount/total figure the header shows. */
  checkedItems: Record<string, boolean>;
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

/** Strips the leading "04 " off a check code, e.g. "04 HOURS" -> "HOURS". */
function bareCode(code: string): string {
  return code.replace(/^\d+\s*/, '');
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

/** Hero #1 — Final Mission Value. The single biggest number on the
 * receipt, on purpose: readable within a second, before anything else. */
function FinalMissionValueHero({ afterCheck }: { afterCheck: AfterCheckOutput | null }) {
  return (
    <div className="space-y-1.5 py-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Final Mission Value</p>
      {afterCheck ? (
        <>
          <p className="font-display text-5xl font-bold tabular-nums text-gold drop-shadow-[0_0_24px_rgba(255,215,104,0.45)]">
            {formatVcdbValue(afterCheck.result.finalScore)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">League Points</p>
        </>
      ) : (
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink-muted">Pending Calculation</p>
      )}
    </div>
  );
}

/** Hero #2 — Winst door Dubbelcheck, sized ~75% of Hero #1. Never a
 * fabricated "+0,00": a real zero reads as "no change recorded", a missing
 * Calculator session reads as "not calculated" — only an actual non-zero
 * delta ever prints a number. */
function DubbelcheckHero({ afterCheck }: { afterCheck: AfterCheckOutput | null }) {
  const state = getDubbelcheckState(afterCheck ? afterCheck.found.foundLeaguePoints : null);
  return (
    <div className="space-y-1.5 py-1 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Winst door Dubbelcheck</p>
      {state.kind === 'found' && (
        <>
          <p className="font-display text-4xl font-bold tabular-nums text-gold drop-shadow-[0_0_18px_rgba(255,215,104,0.35)]">
            {formatFoundPoints(state.points)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">Extra League Points</p>
        </>
      )}
      {state.kind === 'none-recorded' && (
        <p className="font-display text-lg font-bold uppercase tracking-wide text-ink-muted">Geen Extra Winst Vastgelegd</p>
      )}
      {state.kind === 'not-calculated' && (
        <p className="font-display text-lg font-bold uppercase tracking-wide text-ink-muted">Niet Berekend</p>
      )}
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
 *
 * A Mission Receipt is available at any checked count and with or without
 * a Calculator session behind it — 6/6 only changes the status it shows,
 * it is never required to print. Reading order, top to bottom: identity/
 * status, then the two heroes (Final Mission Value — the total deal value,
 * always the single biggest number on the card — then Winst door
 * Dubbelcheck, deliberately smaller and never a bare "+0,00": a real zero
 * reads as a plain status line, not a numeric hero), then deal detail,
 * the before/after breakdown, and only then the open/completed checks.
 */
export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(function ReceiptCard(
  { beforeCheck, afterCheck, agent, checkedItems, checkedCount, total },
  ref,
) {
  const missionApproved = checkedCount === total;
  const openItems = LEAGUE_CHECK_ITEMS.filter((item) => !checkedItems[item.id]);
  const term = afterCheck ? getQualifyingTermRange(afterCheck.form) : null;
  const vcdb = afterCheck ? vcdbFieldFor(afterCheck.form) : null;

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
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Operatie Wintertrip 2027</p>
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
              {missionApproved ? 'Approved' : 'Open'} <span className="text-ink-muted">{checkedCount}/{total}</span>
            </span>
          </div>
        </div>

        <ReceiptDivider />

        {/* Hero #1 + Hero #2 — read within a second, before anything else:
            the total deal value, then any extra the check surfaced. Open
            checks and the completed/open checklist come later, after the
            before/after breakdown — see the block right before the grid
            below. */}
        <FinalMissionValueHero afterCheck={afterCheck} />
        <ReceiptDivider />
        <DubbelcheckHero afterCheck={afterCheck} />

        {afterCheck && (
          <>
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
              <ReceiptRow label="VCDB / Month" value={formatVcdbValue(Number((vcdb ?? '0').replace(',', '.')) || 0)} />
              <ReceiptRow label="Factor" value={formatFactor(afterCheck.form.factor)} />
            </div>
          </>
        )}

        {beforeCheck && afterCheck && (
          <>
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

            <div className="space-y-1.5">
              <ReceiptRow label="Base Points Found" value={formatFoundPoints(afterCheck.found.foundBasePoints)} />
              <ReceiptRow label="Factor Boost" value={`× ${afterCheck.form.factor.toLocaleString('nl-NL')}`} />
            </div>
          </>
        )}

        {!missionApproved && (
          <>
            <ReceiptDivider />
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Open Checks</p>
              {openItems.map((item) => (
                <p key={item.id} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink">
                  <span className="text-ink-muted">○</span> {bareCode(item.code)}
                </p>
              ))}
              <p className="pt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">Mogelijke extra winst nog niet gecontroleerd</p>
            </div>
          </>
        )}

        <ReceiptDivider />

        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {LEAGUE_CHECK_ITEMS.map((item) => {
            const done = Boolean(checkedItems[item.id]);
            return (
              <li key={item.id} className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${done ? 'text-ink' : 'text-ink-muted'}`}>
                <span className={done ? 'text-gold' : 'text-ink-muted'}>{done ? '✓' : '○'}</span>
                {bareCode(item.code)}
              </li>
            );
          })}
        </ul>

        <ReceiptDivider />

        {missionApproved ? (
          <div className="space-y-1 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Mission Approved</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">2 Paar Ogen</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">0 Punten Laten Liggen</p>
          </div>
        ) : (
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Mogelijke winst nog niet volledig gecontroleerd
            </p>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <ReceiptBarcode />
        </div>
        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-ink-dim">WS27-2609-ZWL</p>
      </div>
    </div>
  );
});

/**
 * The Mission Receipt — a premium 007-style intelligence receipt available
 * from the League Check at any point, laying BEFORE and AFTER side by side
 * when a Calculator session backs it so the commercial improvement the
 * check surfaced is unmistakable. Found points come straight from
 * services/missionReceipt.ts: a pure Base Score delta, never inflated by a
 * Factor change alone, and never fabricated for an unchecked item.
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
