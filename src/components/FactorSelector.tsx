import { FACTOR_OPTIONS } from '../config/scoringConfig';
import { formatFactor } from '../utils/format';

interface FactorSelectorProps {
  value: number;
  onChange: (factor: number) => void;
}

export function FactorSelector({ value, onChange }: FactorSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Selecteer Factor (contractantenpositie)"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {FACTOR_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.position + option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1 rounded-md border px-3 py-4 text-center transition-all duration-200 ${
              selected
                ? 'border-gold bg-gold/10 shadow-gold'
                : 'border-white/10 bg-mission-panel/60 hover:border-gold/40'
            }`}
          >
            <span className={`label-classified ${selected ? 'text-gold' : ''}`}>{option.position}</span>
            <span className={`font-display text-2xl font-semibold ${selected ? 'text-gold' : 'text-ink'}`}>
              {formatFactor(option.value)}
            </span>
            <span className="text-[11px] text-ink-muted">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
