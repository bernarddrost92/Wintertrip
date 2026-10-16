import { FormField, TextInput } from '../../components/FormField';
import { formatIsoDateNl } from '../../utils/dates';
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
      <div className="flex-1 space-y-5 px-4 py-5 sm:px-5">
        <div>
          <p className="form-label mb-1.5">Soort deal</p>
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
            <FormField id="oldEndDate" label="Huidige einddatum">
              <TextInput id="oldEndDate" type="date" value={form.oldEndDate} onChange={(e) => update('oldEndDate', e.target.value)} />
            </FormField>

            {output.extensionTiming && (
              <div className={`border px-3.5 py-3 ${output.extensionTiming.qualifies ? 'border-gold/35 bg-gold/[0.06]' : 'border-gold/60 bg-gold/10'}`} role="status">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-ink-muted">Nieuwe termijn start</span>
                  <span className="bg-gold/15 px-2 py-0.5 text-[13px] font-semibold text-gold">
                    {output.extensionTiming.qualifies ? 'Telt mee' : 'Te laat'}
                  </span>
                </div>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-ink">{formatIsoDateNl(output.extensionTiming.newTermStart)}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                  {output.extensionTiming.qualifies ? 'Vóór 31 januari — de hele nieuwe termijn telt mee.' : 'Start na 31 januari — deze verlenging telt niet mee.'}
                </p>
              </div>
            )}

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
          <p className="form-label mb-1.5">Factor</p>
          <FactorDial value={form.factor} onChange={(f) => update('factor', f)} />
        </div>
      </div>

    </div>
  );
}
