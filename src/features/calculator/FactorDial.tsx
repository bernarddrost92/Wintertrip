import { FACTOR_OPTIONS } from '../../config/leagueRules';
import { formatFactor } from '../../utils/format';

interface FactorDialProps {
  value: number;
  onChange: (factor: number) => void;
}

/** Premium vertical factor control — a ranking ladder, not a dropdown. */
export function FactorDial({ value, onChange }: FactorDialProps) {
  return (
    <div role="radiogroup" aria-label="Factor" className="border border-gold/20 bg-mission-panel">
      {FACTOR_OPTIONS.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.position + option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative flex w-full items-center justify-between px-3.5 py-2 text-left transition-colors duration-150 ${
              i > 0 ? 'border-t border-gold/10' : ''
            } ${selected ? 'bg-gold/[0.09]' : 'hover:bg-white/[0.03]'}`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-[3px] transition-colors duration-150 ${selected ? 'bg-gold shadow-gold' : 'bg-transparent'}`}
              aria-hidden
            />
            <span className={`text-xs font-semibold uppercase tracking-wider ${selected ? 'text-gold' : 'text-ink-muted'}`}>
              {option.position}
            </span>
            <span className={`font-display text-lg font-semibold tabular-nums ${selected ? 'text-gold' : 'text-ink'}`}>
              {formatFactor(option.value)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
