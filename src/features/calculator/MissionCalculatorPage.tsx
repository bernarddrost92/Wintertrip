import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { SectionHeader } from '../../components/SectionHeader';
import { StepMissionDetails } from './StepMissionDetails';
import { StepMissionType } from './StepMissionType';
import { StepMissionValue } from './StepMissionValue';
import { StepSelectFactor } from './StepSelectFactor';
import { useMissionCalculator } from './useMissionCalculator';

const STEPS = [
  { number: 1, label: 'Mission Type' },
  { number: 2, label: 'Mission Details' },
  { number: 3, label: 'Select Factor' },
  { number: 4, label: 'Mission Value' },
] as const;

export function MissionCalculatorPage() {
  const { step, setStep, form, update, setMissionType, reset, result } = useMissionCalculator();

  const canGoToStep2 = form.missionType !== null;
  const canGoToStep3 = canGoToStep2 && result.detailsValid;
  const canGoToStep4 = canGoToStep3;

  const canProceed = step === 1 ? canGoToStep2 : step === 2 ? canGoToStep3 : step === 3 ? canGoToStep4 : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeader
        eyebrow="Mission Calculator"
        title="Bereken de waarde van je deal"
        subtitle="Elke deal telt. Geen punten laten liggen."
      />

      <ol className="mt-8 flex items-center gap-2" aria-label="Voortgang">
        {STEPS.map((s, i) => (
          <li key={s.number} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => s.number < step && setStep(s.number)}
              disabled={s.number > step}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold transition-colors ${
                s.number === step
                  ? 'border-gold bg-gold/10 text-gold'
                  : s.number < step
                    ? 'border-gold/40 bg-mission-raised text-gold/80'
                    : 'border-white/15 text-ink-muted'
              }`}
              aria-current={s.number === step ? 'step' : undefined}
            >
              {String(s.number).padStart(2, '0')}
            </button>
            <span className={`hidden text-xs font-semibold uppercase tracking-wider sm:block ${s.number === step ? 'text-ink' : 'text-ink-muted'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/10" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        {step === 1 && <StepMissionType value={form.missionType} onSelect={setMissionType} />}
        {step === 2 && <StepMissionDetails form={form} update={update} />}
        {step === 3 && (
          <StepSelectFactor
            factor={form.factor}
            onChange={(f) => update('factor', f)}
            baseScore={result.breakdown?.baseScore ?? 0}
            breakdown={result.breakdown}
          />
        )}
        {step === 4 && <StepMissionValue result={result} />}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
        <GoldButton variant="ghost" icon={<RotateCcw size={15} />} onClick={reset}>
          Reset
        </GoldButton>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <GoldButton variant="subtle" icon={<ChevronLeft size={15} />} onClick={() => setStep(step - 1)}>
              Vorige
            </GoldButton>
          )}
          {step < 4 && (
            <GoldButton
              variant="primary"
              icon={<ChevronRight size={15} />}
              iconPosition="right"
              disabled={!canProceed}
              onClick={() => setStep(step + 1)}
            >
              {step === 3 ? 'Calculate Mission' : 'Volgende'}
            </GoldButton>
          )}
        </div>
      </div>
    </div>
  );
}
