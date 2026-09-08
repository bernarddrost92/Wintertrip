import { FormField, TextInput } from '../../components/FormField';
import { FactorDial } from '../calculator/FactorDial';
import { evaluateExtensionTiming } from '../../services/scoring';
import { formatIsoDateNl, isValidIsoDate } from '../../utils/dates';
import type { AfterCheckOutput } from './useAfterCheck';

interface AfterCheckEditorProps {
  afterCheck: AfterCheckOutput;
}

/**
 * The compact "did you find points?" editor — the current deal values,
 * already filled in, editable only where a real commercial improvement
 * might live. Not a second big form: no mission-type switch, no deal
 * category, just the handful of fields that can actually move the needle
 * for whichever mission type this deal already is.
 */
export function AfterCheckEditor({ afterCheck }: AfterCheckEditorProps) {
  const { form, update } = afterCheck;

  return (
    <div className="space-y-4">
      {form.missionType === 'NEW_PLACEMENT' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField id="after-startDate" label="Startdatum">
            <TextInput id="after-startDate" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </FormField>
          <FormField id="after-endDate" label="Einddatum">
            <TextInput id="after-endDate" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
          </FormField>
          <FormField id="after-vcdb" label="VCDB / maand">
            <TextInput
              id="after-vcdb"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={form.vcdbPerMonth}
              onChange={(e) => update('vcdbPerMonth', e.target.value)}
            />
          </FormField>
        </div>
      )}

      {form.missionType === 'EXTENSION' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField id="after-oldEndDate" label="Huidige einddatum">
              <TextInput id="after-oldEndDate" type="date" value={form.oldEndDate} onChange={(e) => update('oldEndDate', e.target.value)} />
            </FormField>
            <FormField id="after-newEndDate" label="Nieuwe einddatum">
              <TextInput id="after-newEndDate" type="date" value={form.newEndDate} onChange={(e) => update('newEndDate', e.target.value)} />
            </FormField>
            <FormField id="after-extVcdb" label="VCDB / maand">
              <TextInput
                id="after-extVcdb"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={form.extensionVcdbPerMonth}
                onChange={(e) => update('extensionVcdbPerMonth', e.target.value)}
              />
            </FormField>
          </div>
          {isValidIsoDate(form.oldEndDate) && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              New term start <span className="text-gold">{formatIsoDateNl(evaluateExtensionTiming(form.oldEndDate).newTermStart)}</span>
            </p>
          )}
        </>
      )}

      {form.missionType === 'HOURS_INCREASE' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField id="after-increaseStartDate" label="Startdatum">
            <TextInput
              id="after-increaseStartDate"
              type="date"
              value={form.increaseStartDate}
              onChange={(e) => update('increaseStartDate', e.target.value)}
            />
          </FormField>
          <FormField id="after-increaseEndDate" label="Einddatum">
            <TextInput id="after-increaseEndDate" type="date" value={form.increaseEndDate} onChange={(e) => update('increaseEndDate', e.target.value)} />
          </FormField>
          <FormField id="after-oldHours" label="Oude uren/week">
            <TextInput id="after-oldHours" type="number" min={0} step="0.5" inputMode="decimal" value={form.oldHours} onChange={(e) => update('oldHours', e.target.value)} />
          </FormField>
          <FormField id="after-newHours" label="Nieuwe uren/week">
            <TextInput id="after-newHours" type="number" min={0} step="0.5" inputMode="decimal" value={form.newHours} onChange={(e) => update('newHours', e.target.value)} />
          </FormField>
          <FormField id="after-extraVcdb" label="Extra VCDB / maand">
            <TextInput
              id="after-extraVcdb"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={form.extraVcdbPerMonth}
              onChange={(e) => update('extraVcdbPerMonth', e.target.value)}
            />
          </FormField>
        </div>
      )}

      <div>
        <p className="label-classified mb-1.5">Factor</p>
        <FactorDial value={form.factor} onChange={(f) => update('factor', f)} />
      </div>
    </div>
  );
}
