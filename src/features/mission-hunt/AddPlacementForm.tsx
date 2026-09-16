import { useState } from 'react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import type { NewPlacementInput } from '../../types/missionHunt';

interface AddPlacementFormProps {
  onAdd: (input: NewPlacementInput) => Promise<void> | void;
  onCancel: () => void;
}

const EMPTY = { professionalName: '', clientName: '', startDate: '', endDate: '', hoursPerWeek: '', monthlyDb: '' };

/** "+ Plaatsing toevoegen" — never asks for accountmanager/email, the app
 * already knows who's signed in (owner is filled in by the caller). */
export function AddPlacementForm({ onAdd, onCancel }: AddPlacementFormProps) {
  const [fields, setFields] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canSubmit = fields.professionalName.trim() !== '' && fields.clientName.trim() !== '' && fields.startDate !== '' && fields.endDate !== '' && !saving;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({
      professionalName: fields.professionalName.trim(),
      clientName: fields.clientName.trim(),
      startDate: fields.startDate,
      endDate: fields.endDate,
      hoursPerWeek: fields.hoursPerWeek === '' ? null : Number(fields.hoursPerWeek),
      monthlyDb: fields.monthlyDb === '' ? null : Number(fields.monthlyDb),
    });
    setSaving(false);
    setFields(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-gold/20 bg-mission-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="mh-add-professional" label="Professional *">
          <TextInput id="mh-add-professional" required value={fields.professionalName} onChange={(e) => setFields({ ...fields, professionalName: e.target.value })} />
        </FormField>
        <FormField id="mh-add-client" label="Klant *">
          <TextInput id="mh-add-client" required value={fields.clientName} onChange={(e) => setFields({ ...fields, clientName: e.target.value })} />
        </FormField>
        <FormField id="mh-add-start" label="Startdatum *">
          <TextInput id="mh-add-start" type="date" required value={fields.startDate} onChange={(e) => setFields({ ...fields, startDate: e.target.value })} />
        </FormField>
        <FormField id="mh-add-end" label="Einddatum *">
          <TextInput id="mh-add-end" type="date" required value={fields.endDate} onChange={(e) => setFields({ ...fields, endDate: e.target.value })} />
        </FormField>
        <FormField id="mh-add-hours" label="Uren per week">
          <TextInput id="mh-add-hours" type="number" step="0.5" value={fields.hoursPerWeek} onChange={(e) => setFields({ ...fields, hoursPerWeek: e.target.value })} />
        </FormField>
        <FormField id="mh-add-db" label="DB per maand">
          <TextInput id="mh-add-db" type="number" step="0.01" value={fields.monthlyDb} onChange={(e) => setFields({ ...fields, monthlyDb: e.target.value })} />
        </FormField>
      </div>
      <div className="flex gap-2">
        <GoldButton type="submit" disabled={!canSubmit}>
          {saving ? 'Opslaan…' : 'Plaatsing toevoegen'}
        </GoldButton>
        <GoldButton type="button" variant="subtle" onClick={onCancel}>
          Annuleren
        </GoldButton>
      </div>
    </form>
  );
}
