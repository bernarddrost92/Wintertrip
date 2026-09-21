import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { formatIsoDateNl } from '../../utils/dates';
import { classifyPlacement } from '../../services/missionHuntClassification';
import { badgesForClassification } from '../../services/missionHuntOpportunity';
import { formatClientLocation, formatDisplayDb, formatProfessionalInitials } from '../../utils/privacyDisplay';
import type { MissionHuntPlacement, PlacementFieldUpdate, TalentManagerLink } from '../../types/missionHunt';

export interface KnownTalentManagerOption {
  email: string;
  displayName: string;
}

interface PlacementDetailDrawerProps {
  placement: MissionHuntPlacement;
  editable: boolean;
  /** Admin-only: reassign a placement to a different accountmanager email. */
  canReassign: boolean;
  /** The Talent Managers currently linked to this placement. */
  talentManagerLinks: TalentManagerLink[];
  /** Admin-only: every distinct TM seen anywhere else in the app, offered
   * as checkboxes — same pattern as reassigning an AM: the assignment is
   * admin-controlled, never self-service. */
  canManageTalentManagers: boolean;
  knownTalentManagerOptions: KnownTalentManagerOption[];
  onClose: () => void;
  onUpdateField: (field: keyof PlacementFieldUpdate, value: string | number | null) => void;
  onReassign: (ownerEmail: string, ownerDisplayName: string) => void;
  onUpdateTalentManagers: (emails: string[], displayNames: string[]) => void;
  onDelete: () => void;
}

/**
 * Full detail view for one placement — editable in place for the owner (or
 * an admin), read-only for a colleague looking someone else's placement
 * up. Each field saves on blur. Classification badges are shown but never
 * editable — they're derived, not chosen.
 */
export function PlacementDetailDrawer({
  placement,
  editable,
  canReassign,
  talentManagerLinks,
  canManageTalentManagers,
  knownTalentManagerOptions,
  onClose,
  onUpdateField,
  onReassign,
  onUpdateTalentManagers,
  onDelete,
}: PlacementDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const classification = classifyPlacement(placement.startDate, placement.endDate, placement.hoursPerWeek);
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
      aria-label={`Plaatsing — ${formatProfessionalInitials(placement.professionalName)}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mission-void/90 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg border border-gold/30 bg-mission-panel shadow-gold-lg">
        <div className="flex items-start justify-between gap-4 border-b border-gold/15 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="label-classified text-gold/70">{editable ? 'Mijn plaatsing' : `Plaatsing van ${placement.ownerDisplayName ?? placement.ownerEmail}`}</p>
            <p className="mt-1 truncate font-display text-lg font-bold uppercase tracking-wide text-ink">{formatProfessionalInitials(placement.professionalName) || '—'}</p>
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

          {/* Privacy hotfix: the masked value renders by default, whether
              or not this drawer is editable — "editable" is always true in
              the real app (see missionHuntPermissions — everyone may edit),
              so gating the mask on editable would never actually mask
              anything live. WIJZIG reveals the real stored value in an
              editable input on demand — the input's own defaultValue is
              always the real, full-precision value, so a save always
              writes back exactly what was there or what was deliberately
              typed, never the masked/rounded display value. */}
          <DetailField label="Professional" value={placement.professionalName} editable={editable} onSave={(v) => onUpdateField('professionalName', v)} displayValue={formatProfessionalInitials(placement.professionalName)} />
          <DetailField label="Klant" value={placement.clientName} editable={editable} onSave={(v) => onUpdateField('clientName', v)} displayValue={formatClientLocation(placement.clientName, placement.clientCity)} />

          <div className="grid grid-cols-2 gap-3">
            <DetailDateField label="Startdatum" value={placement.startDate} editable={editable} onSave={(v) => onUpdateField('startDate', v)} />
            <DetailDateField label="Einddatum" value={placement.endDate} editable={editable} onSave={(v) => onUpdateField('endDate', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailNumberField label="Uren per week" value={placement.hoursPerWeek} editable={editable} onSave={(v) => onUpdateField('hoursPerWeek', v)} />
            <DetailNumberField label="DB per maand" value={placement.monthlyDb} editable={editable} onSave={(v) => onUpdateField('monthlyDb', v)} displayValue={formatDisplayDb(placement.monthlyDb)} />
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

          <div className="border-t border-white/8 pt-4">
            <p className="label-classified mb-2 text-gold/70">Talent Managers</p>
            {canManageTalentManagers ? (
              <TalentManagerAssignment
                currentLinks={talentManagerLinks}
                knownOptions={knownTalentManagerOptions}
                onSave={onUpdateTalentManagers}
              />
            ) : talentManagerLinks.length > 0 ? (
              <p className="text-sm text-ink">{talentManagerLinks.map((l) => l.talentManagerDisplayName || l.talentManagerEmail).join(', ')}</p>
            ) : (
              <p className="text-sm text-ink-muted">Geen talent manager gekoppeld.</p>
            )}
          </div>

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

/**
 * Admin-only checkbox UX for TM assignment ("☑ Kim ☑ Monique ☐ Huub") plus
 * a free-text add-by-email row for a TM not yet known anywhere else.
 * Writes only on explicit Save — never per-checkbox — so a normal
 * AM/TM user (who never sees this control at all) can't be affected by
 * an in-progress admin edit, and the admin can freely toggle before
 * committing.
 */
function TalentManagerAssignment({
  currentLinks,
  knownOptions,
  onSave,
}: {
  currentLinks: TalentManagerLink[];
  knownOptions: KnownTalentManagerOption[];
  onSave: (emails: string[], displayNames: string[]) => void;
}) {
  const initial = new Map(currentLinks.map((l) => [l.talentManagerEmail, l.talentManagerDisplayName ?? l.talentManagerEmail]));
  const [selected, setSelected] = useState<Map<string, string>>(initial);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [dirty, setDirty] = useState(false);

  const options = new Map<string, string>();
  for (const opt of knownOptions) options.set(opt.email, opt.displayName || opt.email);
  for (const [email, name] of selected) if (!options.has(email)) options.set(email, name);

  function toggle(email: string, displayName: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(email)) next.delete(email);
      else next.set(email, displayName);
      return next;
    });
    setDirty(true);
  }

  function addNew() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setSelected((prev) => new Map(prev).set(email, newName.trim() || email));
    setNewEmail('');
    setNewName('');
    setDirty(true);
  }

  function handleSave() {
    onSave([...selected.keys()], [...selected.values()]);
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {options.size > 0 && (
        <div className="flex flex-col gap-1.5">
          {[...options.entries()].map(([email, displayName]) => (
            <label key={email} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={selected.has(email)} onChange={() => toggle(email, displayName)} className="h-3.5 w-3.5 accent-gold" />
              {displayName}
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <FormField id="mh-detail-tm-new-name" label="Naam (nieuw)">
          <TextInput id="mh-detail-tm-new-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </FormField>
        <FormField id="mh-detail-tm-new-email" label="E-mailadres (nieuw)">
          <TextInput id="mh-detail-tm-new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </FormField>
        <GoldButton type="button" variant="ghost" onClick={addNew} className="!px-3 !py-2 !text-xs">
          + Toevoegen
        </GoldButton>
      </div>

      {dirty && (
        <GoldButton type="button" variant="subtle" onClick={handleSave} className="self-start !px-3 !py-1.5 !text-xs">
          Toewijzing opslaan
        </GoldButton>
      )}
    </div>
  );
}

/** Shows `displayValue` (masked) by default; WIJZIG reveals a real input
 * seeded with the real `value`, for a deliberate edit. Never shows the
 * real value passively. */
function DetailField({
  label,
  value,
  editable,
  onSave,
  displayValue,
}: {
  label: string;
  value: string;
  editable: boolean;
  onSave: (v: string) => void;
  displayValue: string;
}) {
  const id = `mh-detail-${label.toLowerCase()}`;
  const [revealed, setRevealed] = useState(false);
  return (
    <FormField id={id} label={label}>
      {editable && revealed ? (
        <TextInput id={id} defaultValue={value} onBlur={(e) => onSave(e.target.value)} autoFocus />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink">{displayValue || '—'}</p>
          {editable && (
            <button type="button" onClick={() => setRevealed(true)} className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
              Wijzig
            </button>
          )}
        </div>
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

/** `displayValue` is optional — omitted for fields that stay visible as-is
 * (e.g. Uren per week/FTE); passed for DB, which must never show its
 * decimal value passively. WIJZIG always reveals the real, full-precision
 * value for editing — a save never writes the rounded display value. */
function DetailNumberField({
  label,
  value,
  editable,
  onSave,
  displayValue,
}: {
  label: string;
  value: number | null;
  editable: boolean;
  onSave: (v: number | null) => void;
  displayValue?: string;
}) {
  const id = `mh-detail-${label.toLowerCase()}`;
  const [revealed, setRevealed] = useState(false);
  const masked = displayValue !== undefined;

  if (editable && (!masked || revealed)) {
    return (
      <FormField id={id} label={label}>
        <TextInput
          id={id}
          type="number"
          step="0.5"
          defaultValue={value ?? ''}
          onBlur={(e) => onSave(e.target.value === '' ? null : Number(e.target.value))}
          autoFocus={revealed}
        />
      </FormField>
    );
  }

  return (
    <FormField id={id} label={label}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink">{displayValue ?? value ?? '—'}</p>
        {editable && masked && (
          <button type="button" onClick={() => setRevealed(true)} className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
            Wijzig
          </button>
        )}
      </div>
    </FormField>
  );
}
