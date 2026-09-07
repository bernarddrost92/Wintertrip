import { FACTOR_OPTIONS } from '../../config/leagueRules';
import { formatFactor } from '../../utils/format';

interface FactorDialProps {
  value: number;
  onChange: (factor: number) => void;
}

/** Premium vertical factor control — an instrument ladder with a tick rail, not a dropdown. */
export function FactorDial({ value, onChange }: FactorDialProps) {
  return (
    <div role="radiogroup" aria-label="Factor" className="relative border border-gold/20 bg-mission-panel">
      {/* Continuous gauge rail running the height of the ladder, ticked per rung. */}
      <div className="pointer-events-none absolute bottom-3 left-0 top-3 w-5 border-l border-gold/15" aria-hidden />
      {FACTOR_OPTIONS.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.position + option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative flex w-full items-center justify-between py-2 pl-8 pr-3.5 text-left transition-colors duration-150 ${
              i > 0 ? 'border-t border-gold/10' : ''
            } ${selected ? 'bg-gold/[0.09]' : 'hover:bg-white/[0.03]'}`}
          >
            <span
              className={`absolute left-0 top-1/2 h-px w-5 -translate-y-1/2 transition-colors duration-150 ${selected ? 'bg-gold' : 'bg-gold/25'}`}
              aria-hidden
            />
            <span
              className={`absolute left-[15px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 transition-all duration-150 ${
                selected ? 'scale-100 bg-gold shadow-gold' : 'scale-75 bg-transparent'
              }`}
              aria-hidden
            />
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
