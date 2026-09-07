import { Check } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { DealCategoryToggle } from './DealCategoryToggle';
import { FactorDial } from './FactorDial';
import type { CalculatorForm, CalculatorOutput } from './useMissionControlCalculator';

interface MissionInputPanelProps {
  form: CalculatorForm;
  update: <K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) => void;
  output: CalculatorOutput;
}

export function MissionInputPanel({ form, update, output }: MissionInputPanelProps) {
  return (
    <div className="panel flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
        <h2 className="label-classified text-ink">Mission Input</h2>
        <span
          className={`font-mono text-[11px] font-semibold tracking-wider ${
            output.isInputComplete ? 'text-gold' : 'text-ink-muted'
          }`}
        >
          {output.completeCount} / {output.totalCount} COMPLETE
        </span>
      </header>

      <div className="flex-1 space-y-4 px-4 py-4">
        <div>
          <p className="label-classified mb-1.5">Deal Category</p>
          <DealCategoryToggle value={form.dealCategory} onChange={(c) => update('dealCategory', c)} />
        </div>

        {form.missionType === 'NEW_PLACEMENT' && (
          <>
            <FormField id="startDate" label="Startdatum">
              <TextInput id="startDate" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
            </FormField>
            <FormField id="endDate" label="Einddatum">
              <TextInput id="endDate" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
            </FormField>
            <FormField id="vcdb" label="VCDB per volledige maand">
              <TextInput
                id="vcdb"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                placeholder="bijv. 10"
                value={form.vcdbPerMonth}
                onChange={(e) => update('vcdbPerMonth', e.target.value)}
              />
            </FormField>
          </>
        )}

        {form.missionType === 'EXTENSION' && (
          <>
            <FormField id="awardDate" label="Award date" hint="Datum waarop de verlenging binnen de league wordt afgesproken.">
              <TextInput id="awardDate" type="date" value={form.awardDate} onChange={(e) => update('awardDate', e.target.value)} />
            </FormField>
            <FormField id="oldEndDate" label="Huidige einddatum">
              <TextInput id="oldEndDate" type="date" value={form.oldEndDate} onChange={(e) => update('oldEndDate', e.target.value)} />
            </FormField>
            <FormField id="newEndDate" label="Nieuwe einddatum">
              <TextInput id="newEndDate" type="date" value={form.newEndDate} onChange={(e) => update('newEndDate', e.target.value)} />
            </FormField>
            <FormField id="extVcdb" label="VCDB per volledige maand">
              <TextInput
                id="extVcdb"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                placeholder="bijv. 9"
                value={form.extensionVcdbPerMonth}
                onChange={(e) => update('extensionVcdbPerMonth', e.target.value)}
              />
            </FormField>
          </>
        )}

        {form.missionType === 'HOURS_INCREASE' && (
          <>
            <FormField id="increaseStartDate" label="Startdatum uitbreiding">
              <TextInput
                id="increaseStartDate"
                type="date"
                value={form.increaseStartDate}
                onChange={(e) => update('increaseStartDate', e.target.value)}
              />
            </FormField>
            <FormField id="increaseEndDate" label="Einddatum">
              <TextInput
                id="increaseEndDate"
                type="date"
                value={form.increaseEndDate}
                onChange={(e) => update('increaseEndDate', e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="oldHours" label="Oude uren/week">
                <TextInput
                  id="oldHours"
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={form.oldHours}
                  onChange={(e) => update('oldHours', e.target.value)}
                />
              </FormField>
              <FormField id="newHours" label="Nieuwe uren/week">
                <TextInput
                  id="newHours"
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={form.newHours}
                  onChange={(e) => update('newHours', e.target.value)}
                />
              </FormField>
            </div>
            <FormField id="extraVcdb" label="Extra VCDB per maand" hint="VCDB-waarde van uitsluitend de extra uren.">
              <TextInput
                id="extraVcdb"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                placeholder="bijv. 4"
                value={form.extraVcdbPerMonth}
                onChange={(e) => update('extraVcdbPerMonth', e.target.value)}
              />
            </FormField>
          </>
        )}

        <div>
          <p className="label-classified mb-1.5">Factor</p>
          <FactorDial value={form.factor} onChange={(f) => update('factor', f)} />
        </div>
      </div>

      <ul className="border-t border-gold/15 px-4 py-3">
        {output.completion.map((item) => (
          <li key={item.key} className="flex items-center gap-2 py-0.5 text-xs">
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${
                item.done ? 'text-gold' : 'text-ink-dim'
              }`}
              aria-hidden
            >
              {item.done ? <Check size={12} strokeWidth={3} /> : <span className="font-mono">!</span>}
            </span>
            <span className={item.done ? 'text-ink' : 'text-ink-muted'}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
