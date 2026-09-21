import { REVIEW_ACTION_TYPE_LABEL } from '../../services/missionHuntOpportunityReview';
import { formatIsoDateReceipt } from '../../utils/dates';
import { formatClientLocation, formatProfessionalInitials } from '../../utils/privacyDisplay';
import type { MissionHuntPlacement, OpportunityReview } from '../../types/missionHunt';

interface Commitment {
  placement: MissionHuntPlacement;
  review: OpportunityReview;
}

interface OpportunityReceiptProps {
  displayName: string;
  portfolioCount: number;
  opportunityTotal: number;
  reviewedCount: number;
  opvolgen: number;
  geenKans: number;
  later: number;
  commitments: Commitment[];
  onClose: () => void;
}

function ReceiptDivider() {
  return <div className="border-t border-dashed border-gold/20" aria-hidden />;
}

function ReceiptRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11px]">
      <span className="uppercase tracking-wider text-ink-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
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

/**
 * MISSION HUNT RECEIPT — shown once MISSION COMPLETE unlocks (every
 * detected opportunity for this AM has a review state). Fully derived from
 * placements + opportunity_reviews on every render, so it reopens exactly
 * the same after a refresh without any separate "receipt generated" flag.
 * Same premium intelligence-report visual language as League Check's
 * MissionReceipt (mono font, gold hairline, dashed dividers, barcode).
 */
export function OpportunityReceipt({ displayName, portfolioCount, opportunityTotal, reviewedCount, opvolgen, geenKans, later, commitments, onClose }: OpportunityReceiptProps) {
  const today = formatIsoDateReceipt(new Date().toISOString().slice(0, 10));

  return (
    <div className="relative mx-auto max-w-[520px] py-3">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 opacity-60"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(255,215,104,0.14), transparent 72%)' }}
        aria-hidden
      />
      <div
        className="relative border border-gold/25"
        style={{
          background: 'linear-gradient(180deg, #0d1013 0%, #060708 100%)',
          boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7), 0 0 44px -14px rgba(255,215,104,0.12)',
        }}
      >
        <div className="space-y-4 px-6 py-7 font-mono">
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-muted">Team Zwolle</p>
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.14em] text-gold drop-shadow-[0_0_18px_rgba(255,215,104,0.4)]">Mission Hunt Receipt</p>
          </div>

          <ReceiptDivider />

          <div className="space-y-1 text-center">
            <p className="text-base font-semibold uppercase tracking-wide text-ink">{displayName}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{today}</p>
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            <ReceiptRow label="Portfolio" value={`${portfolioCount} plaatsingen`} />
            <ReceiptRow label="Kansen gevonden" value={opportunityTotal} />
            <ReceiptRow label="Beoordeeld" value={`${reviewedCount} / ${opportunityTotal}`} />
          </div>

          <ReceiptDivider />

          <div className="space-y-1.5">
            <ReceiptRow label="Opvolgen" value={opvolgen} />
            <ReceiptRow label="Geen kans" value={geenKans} />
            <ReceiptRow label="Later" value={later} />
          </div>

          {commitments.length > 0 && (
            <>
              <ReceiptDivider />
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">Mijn Commitments</p>
                <ol className="space-y-2">
                  {commitments.map(({ placement, review }, index) => (
                    <li key={placement.id} className="space-y-0.5 text-[11px]">
                      <p className="font-semibold text-ink">
                        {index + 1}. {formatProfessionalInitials(placement.professionalName)} — {formatClientLocation(placement.clientName, placement.clientCity)}
                      </p>
                      {review.actionType && <p className="pl-3.5 uppercase tracking-wider text-gold">{REVIEW_ACTION_TYPE_LABEL[review.actionType]}</p>}
                      {review.note && <p className="pl-3.5 italic text-ink-muted">"{review.note}"</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          <ReceiptDivider />

          <div className="space-y-1 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Mission Committed</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{commitments.length} acties</p>
          </div>

          <div className="flex justify-center pt-2">
            <ReceiptBarcode />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button type="button" onClick={onClose} className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted underline hover:text-gold">
          Sluiten
        </button>
      </div>
    </div>
  );
}
