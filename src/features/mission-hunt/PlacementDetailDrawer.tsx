import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { formatIsoDateNl } from '../../utils/dates';
import { classifyPlacement } from '../../services/missionHuntClassification';
import { badgesForClassification } from '../../services/missionHuntOpportunity';
import type { MissionHuntPlacement, PlacementFieldUpdate } from '../../types/missionHunt';

interface PlacementDetailDrawerProps {
  placement: MissionHuntPlacement;
  editable: boolean;
  /** Admin-only: reassign a placement to a different accountmanager email. */
  canReassign: boolean;
  onClose: () => void;
  onUpdateField: (field: keyof PlacementFieldUpdate, value: string | number | null) => void;
  onReassign: (ownerEmail: string, ownerDisplayName: string) => void;
  onDelete: () => void;
}

/**
 * Full detail view for one placement — editable in place for the owner (or
 * an admin), read-only for a colleague looking someone else's placement
 * up. Each field saves on blur. Classification badges are shown but never
 * editable — they're derived, not chosen.
 */
export function PlacementDetailDrawer({ placement, editable, canReassign, onClose, onUpdateField, onReassign, onDelete }: PlacementDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const classification = classifyPlacement(placement.startDate, placement.endDate);
  const badges = badgesForClassification(classification);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Plaatsing — ${placement.professionalName}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mission-void/90 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg border border-gold/30 bg-mission-panel shadow-gold-lg">
        <div className="flex items-start justify-between gap-4 border-b border-gold/15 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="label-classified text-gold/70">{editable ? 'Mijn plaatsing' : `Plaatsing van ${placement.ownerDisplayName ?? placement.ownerEmail}`}</p>
            <p className="mt-1 truncate font-display text-lg font-bold uppercase tracking-wide text-ink">{placement.professionalName || '—'}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex shrink-0 items-center justify-center border border-gold/30 p-2 text-gold transition-colors duration-150 hover:border-gold hover:bg-gold/10"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span key={badge.label} className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                  <span aria-hidden>{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          <DetailField label="Professional" value={placement.professionalName} editable={editable} onSave={(v) => onUpdateField('professionalName', v)} />
          <DetailField label="Klant" value={placement.clientName} editable={editable} onSave={(v) => onUpdateField('clientName', v)} />

          <div className="grid grid-cols-2 gap-3">
            <DetailDateField label="Startdatum" value={placement.startDate} editable={editable} onSave={(v) => onUpdateField('startDate', v)} />
            <DetailDateField label="Einddatum" value={placement.endDate} editable={editable} onSave={(v) => onUpdateField('endDate', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailNumberField label="Uren per week" value={placement.hoursPerWeek} editable={editable} onSave={(v) => onUpdateField('hoursPerWeek', v)} />
            <DetailNumberField label="DB per maand" value={placement.monthlyDb} editable={editable} onSave={(v) => onUpdateField('monthlyDb', v)} />
          </div>

          <FormField id="mh-detail-note" label="Opmerking">
            {editable ? (
              <textarea
                id="mh-detail-note"
                defaultValue={placement.note ?? ''}
                onBlur={(e) => onUpdateField('note', e.target.value || null)}
                rows={2}
                className="w-full border border-white/15 bg-mission-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none [color-scheme:dark]"
              />
            ) : (
              <p className="text-sm text-ink">{placement.note || '—'}</p>
            )}
          </FormField>

          {canReassign && (
            <div className="border-t border-white/8 pt-4">
              <p className="label-classified mb-2 text-gold/70">Toewijzen (admin)</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField id="mh-detail-owner-name" label="Accountmanager">
                  <TextInput id="mh-detail-owner-name" defaultValue={placement.ownerDisplayName ?? ''} onBlur={(e) => onReassign(placement.ownerEmail, e.target.value)} />
                </FormField>
                <FormField id="mh-detail-owner-email" label="E-mailadres">
                  <TextInput id="mh-detail-owner-email" type="email" defaultValue={placement.ownerEmail} onBlur={(e) => onReassign(e.target.value, placement.ownerDisplayName ?? '')} />
                </FormField>
              </div>
            </div>
          )}

          {editable && (
            <div className="mt-2 border-t border-white/8 pt-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-muted">Deze plaatsing verwijderen?</span>
                  <GoldButton type="button" variant="subtle" onClick={onDelete} className="!px-3 !py-1.5 !text-xs">
                    Ja, verwijderen
                  </GoldButton>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-ink-muted underline">
                    Annuleren
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-red-400"
                >
                  <Trash2 size={13} aria-hidden />
                  Verwijderen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, editable, onSave }: { label: string; value: string; editable: boolean; onSave: (v: string) => void }) {
  const id = `mh-detail-${label.toLowerCase()}`;
  return (
    <FormField id={id} label={label}>
      {editable ? (
        <TextInput id={id} defaultValue={value} onBlur={(e) => onSave(e.target.value)} />
      ) : (
        <p className="text-sm text-ink">{value || '—'}</p>
      )}
    </FormField>
  );
}

function DetailDateField({ label, value, editable, onSave }: { label: string; value: string; editable: boolean; onSave: (v: string) => void }) {
  const id = `mh-detail-${label.toLowerCase()}`;
  return (
    <FormField id={id} label={label}>
      {editable ? (
        <TextInput id={id} type="date" defaultValue={value} onBlur={(e) => onSave(e.target.value)} />
      ) : (
        <p className="text-sm text-ink">{value ? formatIsoDateNl(value) : '—'}</p>
      )}
    </FormField>
  );
}

function DetailNumberField({
  label,
  value,
  editable,
  onSave,
}: {
  label: string;
  value: number | null;
  editable: boolean;
  onSave: (v: number | null) => void;
}) {
  const id = `mh-detail-${label.toLowerCase()}`;
  return (
    <FormField id={id} label={label}>
      {editable ? (
        <TextInput
          id={id}
          type="number"
          step="0.5"
          defaultValue={value ?? ''}
          onBlur={(e) => onSave(e.target.value === '' ? null : Number(e.target.value))}
        />
      ) : (
        <p className="text-sm text-ink">{value ?? '—'}</p>
      )}
    </FormField>
  );
}
