import { useState } from 'react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import type { NewProjectInput } from '../../types/missionHunt';

interface AddProjectFormProps {
  onAdd: (input: NewProjectInput) => Promise<void> | void;
  onCancel: () => void;
}

const EMPTY = { projectName: '', clientName: '', professionalName: '', startDate: '', endDate: '', hoursPerWeek: '', monthlyVcdb: '', note: '' };

/** A single project without going through Excel at all — only Project and
 * Klant are required, matching the import template's own required fields. */
export function AddProjectForm({ onAdd, onCancel }: AddProjectFormProps) {
  const [fields, setFields] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canSubmit = fields.projectName.trim() !== '' && fields.clientName.trim() !== '' && !saving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({
      projectName: fields.projectName.trim(),
      clientName: fields.clientName.trim(),
      professionalName: fields.professionalName.trim() || null,
      startDate: fields.startDate || null,
      endDate: fields.endDate || null,
      hoursPerWeek: fields.hoursPerWeek === '' ? null : Number(fields.hoursPerWeek),
      monthlyVcdb: fields.monthlyVcdb === '' ? null : Number(fields.monthlyVcdb),
      note: fields.note.trim() || null,
    });
    setSaving(false);
    setFields(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-gold/20 bg-mission-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="mh-add-project" label="Project *">
          <TextInput id="mh-add-project" required value={fields.projectName} onChange={(e) => setFields({ ...fields, projectName: e.target.value })} />
        </FormField>
        <FormField id="mh-add-client" label="Klant *">
          <TextInput id="mh-add-client" required value={fields.clientName} onChange={(e) => setFields({ ...fields, clientName: e.target.value })} />
        </FormField>
        <FormField id="mh-add-professional" label="Professional">
          <TextInput id="mh-add-professional" value={fields.professionalName} onChange={(e) => setFields({ ...fields, professionalName: e.target.value })} />
        </FormField>
        <FormField id="mh-add-note" label="Opmerking">
          <TextInput id="mh-add-note" value={fields.note} onChange={(e) => setFields({ ...fields, note: e.target.value })} />
        </FormField>
        <FormField id="mh-add-start" label="Startdatum">
          <TextInput id="mh-add-start" type="date" value={fields.startDate} onChange={(e) => setFields({ ...fields, startDate: e.target.value })} />
        </FormField>
        <FormField id="mh-add-end" label="Einddatum">
          <TextInput id="mh-add-end" type="date" value={fields.endDate} onChange={(e) => setFields({ ...fields, endDate: e.target.value })} />
        </FormField>
        <FormField id="mh-add-hours" label="Uren per week">
          <TextInput id="mh-add-hours" type="number" step="0.5" value={fields.hoursPerWeek} onChange={(e) => setFields({ ...fields, hoursPerWeek: e.target.value })} />
        </FormField>
        <FormField id="mh-add-vcdb" label="VCDB per maand">
          <TextInput id="mh-add-vcdb" type="number" step="0.01" value={fields.monthlyVcdb} onChange={(e) => setFields({ ...fields, monthlyVcdb: e.target.value })} />
        </FormField>
      </div>
      <div className="flex gap-2">
        <GoldButton type="submit" disabled={!canSubmit}>
          {saving ? 'Opslaan…' : 'Project toevoegen'}
        </GoldButton>
        <GoldButton type="button" variant="subtle" onClick={onCancel}>
          Annuleren
        </GoldButton>
      </div>
    </form>
  );
}
