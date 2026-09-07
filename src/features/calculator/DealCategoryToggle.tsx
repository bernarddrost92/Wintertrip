import { DEAL_CATEGORY_OPTIONS } from '../../config/leagueRules';
import type { DealCategory } from '../../types/scoring';

interface DealCategoryToggleProps {
  value: DealCategory;
  onChange: (category: DealCategory) => void;
}

export function DealCategoryToggle({ value, onChange }: DealCategoryToggleProps) {
  return (
    <div role="radiogroup" aria-label="Deal category" className="grid grid-cols-2 border border-gold/20 bg-mission-panel">
      {DEAL_CATEGORY_OPTIONS.map((option, i) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-150 ${
              i > 0 ? 'border-l border-gold/15' : ''
            } ${selected ? 'bg-gold text-mission-void' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
