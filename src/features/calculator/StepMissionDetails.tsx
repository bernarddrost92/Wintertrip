import { AlertTriangle } from 'lucide-react';
import { FormField, SelectInput, TextInput } from '../../components/FormField';
import { DOMAIN_OPTIONS, MIN_HOURS_INCREASE_PER_WEEK, WS_WARNING_MESSAGE } from '../../config/scoringConfig';
import type { CalculatorFormState } from './useMissionCalculator';
import { isNonScoringDomain, validateHoursIncrease } from '../../services/scoring';

interface StepMissionDetailsProps {
  form: CalculatorFormState;
  update: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}

function WsWarning() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold sm:col-span-2">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p>{WS_WARNING_MESSAGE}</p>
    </div>
  );
}

export function StepMissionDetails({ form, update }: StepMissionDetailsProps) {
  const sharedPeopleFields = (
    <>
      <FormField id="am" label="Accountmanager">
        <TextInput
          id="am"
          value={form.accountManager}
          onChange={(e) => update('accountManager', e.target.value)}
          placeholder="Naam accountmanager"
        />
      </FormField>
      <FormField id="tm" label="Talentmanager">
        <TextInput
          id="tm"
          value={form.talentManager}
          onChange={(e) => update('talentManager', e.target.value)}
          placeholder="Naam talentmanager"
        />
      </FormField>
    </>
  );

  if (form.missionType === 'NEW_PLACEMENT') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="startDate" label="Startdatum">
          <TextInput id="startDate" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
        </FormField>
        <FormField id="endDate" label="Einddatum">
          <TextInput id="endDate" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </FormField>
        <FormField id="vcdb" label="VCDB per maand">
          <TextInput
            id="vcdb"
            type="number"
            min={0}
            step="0.1"
            value={form.vcdbPerMonth}
            onChange={(e) => update('vcdbPerMonth', e.target.value)}
            placeholder="bijv. 10"
          />
        </FormField>
        <FormField id="domain" label="Domein">
          <SelectInput id="domain" value={form.domain} onChange={(e) => update('domain', e.target.value as CalculatorFormState['domain'])}>
            <option value="" disabled>
              Kies domein
            </option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </FormField>
        {sharedPeopleFields}
        <FormField id="newContractor" label="Nieuwe contractant">
          <SelectInput
            id="newContractor"
            value={form.newContractor ? 'yes' : 'no'}
            onChange={(e) => update('newContractor', e.target.value === 'yes')}
          >
            <option value="yes">Ja</option>
            <option value="no">Nee</option>
          </SelectInput>
        </FormField>
        {isNonScoringDomain(form.domain) && <WsWarning />}
      </div>
    );
  }

  if (form.missionType === 'EXTENSION') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="currentEndDate" label="Huidige einddatum">
          <TextInput
            id="currentEndDate"
            type="date"
            value={form.currentEndDate}
            onChange={(e) => update('currentEndDate', e.target.value)}
          />
        </FormField>
        <FormField id="newEndDate" label="Nieuwe einddatum">
          <TextInput id="newEndDate" type="date" value={form.newEndDate} onChange={(e) => update('newEndDate', e.target.value)} />
        </FormField>
        <FormField id="extVcdb" label="VCDB per maand" hint="Alleen de nieuw toegevoegde maanden tellen mee.">
          <TextInput
            id="extVcdb"
            type="number"
            min={0}
            step="0.1"
            value={form.extensionVcdbPerMonth}
            onChange={(e) => update('extensionVcdbPerMonth', e.target.value)}
            placeholder="bijv. 9"
          />
        </FormField>
        <FormField id="domain" label="Domein">
          <SelectInput id="domain" value={form.domain} onChange={(e) => update('domain', e.target.value as CalculatorFormState['domain'])}>
            <option value="" disabled>
              Kies domein
            </option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </FormField>
        {sharedPeopleFields}
        {isNonScoringDomain(form.domain) && <WsWarning />}
      </div>
    );
  }

  // HOURS_INCREASE
  const oldHoursNum = Number(form.oldHours.replace(',', '.')) || 0;
  const newHoursNum = Number(form.newHours.replace(',', '.')) || 0;
  const hasBothHours = form.oldHours !== '' && form.newHours !== '';
  const hoursCheck = hasBothHours ? validateHoursIncrease(oldHoursNum, newHoursNum) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="oldHours" label="Oude uren per week">
        <TextInput id="oldHours" type="number" min={0} step="0.5" value={form.oldHours} onChange={(e) => update('oldHours', e.target.value)} />
      </FormField>
      <FormField id="newHours" label="Nieuwe uren per week">
        <TextInput id="newHours" type="number" min={0} step="0.5" value={form.newHours} onChange={(e) => update('newHours', e.target.value)} />
      </FormField>
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
      <FormField id="hoursVcdb" label="Extra VCDB per maand" hint="De VCDB-waarde die hoort bij alléén de extra uren.">
        <TextInput
          id="hoursVcdb"
          type="number"
          min={0}
          step="0.1"
          value={form.hoursVcdbPerMonth}
          onChange={(e) => update('hoursVcdbPerMonth', e.target.value)}
          placeholder="bijv. 4"
        />
      </FormField>
      {sharedPeopleFields}
      {hoursCheck && !hoursCheck.valid && (
        <div className="flex items-start gap-3 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold sm:col-span-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            NIET SCOREBAAR — een stijging van {hoursCheck.increaseHours} u/w haalt de minimale{' '}
            {MIN_HOURS_INCREASE_PER_WEEK} u/w niet.
          </p>
        </div>
      )}
    </div>
  );
}
