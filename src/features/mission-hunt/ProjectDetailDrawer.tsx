import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { formatIsoDateNl } from '../../utils/dates';
import { statusSupportsOpportunityTypes } from '../../services/missionHuntStatus';
import { StatusPicker } from './StatusPicker';
import { OpportunityTypePicker } from './OpportunityTypePicker';
import type { MissionHuntProject, NewProjectInput, OpportunityType, ProjectStatus } from '../../types/missionHunt';

interface ProjectDetailDrawerProps {
  project: MissionHuntProject;
  ownerName: string;
  editable: boolean;
  onClose: () => void;
  onUpdateField: (field: keyof NewProjectInput, value: string | number | null) => void;
  onUpdateStatus: (status: ProjectStatus) => void;
  onUpdateOpportunityTypes: (types: OpportunityType[]) => void;
  onDelete: () => void;
  onCalculateOpportunity: () => void;
}

/**
 * Full detail view for one project — every field, editable in place for the
 * owner (or an admin), read-only for a colleague looking someone else's
 * project up. Each field saves on blur rather than needing a separate Save
 * button, matching the "one tap = saved" feel the status picker already has.
 */
export function ProjectDetailDrawer({
  project,
  ownerName,
  editable,
  onClose,
  onUpdateField,
  onUpdateStatus,
  onUpdateOpportunityTypes,
  onDelete,
  onCalculateOpportunity,
}: ProjectDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
      aria-label={`Project — ${project.projectName}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mission-void/90 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg border border-gold/30 bg-mission-panel shadow-gold-lg">
        <div className="flex items-start justify-between gap-4 border-b border-gold/15 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="label-classified text-gold/70">{editable ? 'Mijn project' : `Project van ${ownerName}`}</p>
            <p className="mt-1 truncate font-display text-lg font-bold uppercase tracking-wide text-ink">{project.projectName}</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <StatusPicker status={project.status} onChange={onUpdateStatus} disabled={!editable} />
          </div>

          {statusSupportsOpportunityTypes(project.status) && (
            <OpportunityTypePicker selected={project.opportunityTypes} onChange={onUpdateOpportunityTypes} disabled={!editable} />
          )}

          {project.status === 'opportunity' && (
            <GoldButton type="button" variant="ghost" onClick={onCalculateOpportunity} className="w-full sm:w-auto">
              Calculate Opportunity
            </GoldButton>
          )}

          <DetailField label="Project" value={project.projectName} editable={editable} onSave={(v) => onUpdateField('projectName', v)} />
          <DetailField label="Klant" value={project.clientName} editable={editable} onSave={(v) => onUpdateField('clientName', v)} />
          <DetailField
            label="Professional"
            value={project.professionalName ?? ''}
            editable={editable}
            onSave={(v) => onUpdateField('professionalName', v || null)}
          />

          <div className="grid grid-cols-2 gap-3">
            <DetailDateField label="Startdatum" value={project.startDate} editable={editable} onSave={(v) => onUpdateField('startDate', v)} />
            <DetailDateField label="Einddatum" value={project.endDate} editable={editable} onSave={(v) => onUpdateField('endDate', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailNumberField label="Uren per week" value={project.hoursPerWeek} editable={editable} onSave={(v) => onUpdateField('hoursPerWeek', v)} />
            <DetailNumberField label="VCDB per maand" value={project.monthlyVcdb} editable={editable} onSave={(v) => onUpdateField('monthlyVcdb', v)} />
          </div>

          <FormField id="mh-detail-note" label="Opmerking">
            {editable ? (
              <textarea
                id="mh-detail-note"
                defaultValue={project.note ?? ''}
                onBlur={(e) => onUpdateField('note', e.target.value || null)}
                rows={2}
                className="w-full border border-white/15 bg-mission-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none [color-scheme:dark]"
              />
            ) : (
              <p className="text-sm text-ink">{project.note || '—'}</p>
            )}
          </FormField>

          {editable && (
            <div className="mt-2 border-t border-white/8 pt-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-muted">Project verwijderen?</span>
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

function DetailDateField({
  label,
  value,
  editable,
  onSave,
}: {
  label: string;
  value: string | null;
  editable: boolean;
  onSave: (v: string | null) => void;
}) {
  const id = `mh-detail-${label.toLowerCase()}`;
  return (
    <FormField id={id} label={label}>
      {editable ? (
        <TextInput id={id} type="date" defaultValue={value ?? ''} onBlur={(e) => onSave(e.target.value || null)} />
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
