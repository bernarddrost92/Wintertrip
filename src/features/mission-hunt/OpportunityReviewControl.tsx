import { useState } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { REVIEW_ACTION_TYPE_LABEL, REVIEW_ACTION_TYPE_ORDER, REVIEW_STATUS_ICON, REVIEW_STATUS_LABEL } from '../../services/missionHuntOpportunityReview';
import type { OpportunityReview, OpportunityReviewActionType, OpportunityReviewStatus } from '../../types/missionHunt';

interface OpportunityReviewControlProps {
  review: OpportunityReview | null;
  onSave: (status: OpportunityReviewStatus, actionType: OpportunityReviewActionType | null, note: string | null) => Promise<void> | void;
}

type Mode = 'idle' | 'choosing' | 'opvolgen-form';

/**
 * BEOORDELEN — the sales-meeting review control for one opportunity
 * placement. GEEN KANS/LATER save immediately on click; OPVOLGEN opens a
 * very small action-type + optional-note form before saving. Never touches
 * the placement's own data — this writes only to opportunity_reviews.
 */
export function OpportunityReviewControl({ review, onSave }: OpportunityReviewControlProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [saving, setSaving] = useState(false);
  const [actionType, setActionType] = useState<OpportunityReviewActionType | null>(null);
  const [note, setNote] = useState('');

  async function save(status: OpportunityReviewStatus, chosenActionType: OpportunityReviewActionType | null, chosenNote: string | null) {
    setSaving(true);
    await onSave(status, chosenActionType, chosenNote);
    setSaving(false);
    setMode('idle');
    setActionType(null);
    setNote('');
  }

  if (review && mode === 'idle') {
    return (
      <div className="flex flex-col gap-1 border-t border-white/8 pt-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-status-go">✓ Beoordeeld</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
            <span aria-hidden>{REVIEW_STATUS_ICON[review.status]}</span>
            {REVIEW_STATUS_LABEL[review.status]}
          </span>
          {review.status === 'opvolgen' && review.actionType && (
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gold">{REVIEW_ACTION_TYPE_LABEL[review.actionType]}</span>
          )}
          <button type="button" onClick={() => setMode('choosing')} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
            Wijzig
          </button>
        </div>
        {review.status === 'opvolgen' && review.note && <p className="text-xs italic text-ink-muted">"{review.note}"</p>}
      </div>
    );
  }

  if (mode === 'idle') {
    return (
      <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Nog te beoordelen</span>
        <GoldButton type="button" variant="subtle" onClick={() => setMode('choosing')} className="!px-3 !py-1.5 !text-[10px]">
          Beoordelen
        </GoldButton>
      </div>
    );
  }

  if (mode === 'choosing') {
    return (
      <div className="flex flex-col gap-2 border-t border-white/8 pt-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Beoordelen</p>
        <div className="flex flex-wrap gap-1.5">
          <GoldButton type="button" variant="ghost" disabled={saving} onClick={() => setMode('opvolgen-form')} className="!px-3 !py-1.5 !text-[10px]">
            🎯 Opvolgen
          </GoldButton>
          <GoldButton type="button" variant="subtle" disabled={saving} onClick={() => void save('geen_kans', null, null)} className="!px-3 !py-1.5 !text-[10px]">
            ✓ Geen Kans
          </GoldButton>
          <GoldButton type="button" variant="subtle" disabled={saving} onClick={() => void save('later', null, null)} className="!px-3 !py-1.5 !text-[10px]">
            → Later
          </GoldButton>
        </div>
      </div>
    );
  }

  // mode === 'opvolgen-form'
  return (
    <div className="flex flex-col gap-2 border-t border-white/8 pt-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">Actie type</p>
      <div className="flex flex-wrap gap-1.5">
        {REVIEW_ACTION_TYPE_ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActionType(type)}
            aria-pressed={actionType === type}
            className={`border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
              actionType === type ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-ink-muted hover:border-white/30'
            }`}
          >
            {REVIEW_ACTION_TYPE_LABEL[type]}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
        Korte notitie (optioneel)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="border border-white/15 bg-mission-raised px-2.5 py-1.5 text-xs font-normal normal-case tracking-normal text-ink placeholder:text-ink-muted/50 focus:border-gold focus:outline-none"
          placeholder="Directeur volgende week bellen voor uitbreiding naar 32 uur."
        />
      </label>
      <div className="flex gap-1.5">
        <GoldButton type="button" disabled={!actionType || saving} onClick={() => void save('opvolgen', actionType, note.trim() || null)} className="!px-3 !py-1.5 !text-[10px]">
          Opslaan
        </GoldButton>
        <GoldButton type="button" variant="subtle" disabled={saving} onClick={() => setMode('choosing')} className="!px-3 !py-1.5 !text-[10px]">
          Terug
        </GoldButton>
      </div>
    </div>
  );
}
