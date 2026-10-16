import { DEAL_CATEGORY_OPTIONS } from '../../config/leagueRules';
import type { DealCategory } from '../../types/scoring';

interface DealCategoryToggleProps {
  value: DealCategory;
  onChange: (category: DealCategory) => void;
}

export function DealCategoryToggle({ value, onChange }: DealCategoryToggleProps) {
  return (
    <div role="radiogroup" aria-label="Soort deal" className="grid grid-cols-2 border border-white/10 bg-mission-panel">
      {DEAL_CATEGORY_OPTIONS.map((option, i) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 py-2 text-sm font-semibold uppercase tracking-[0.06em] transition-colors duration-150 ${
              i > 0 ? 'border-l border-white/[0.07]' : ''
            } ${selected ? 'bg-gold text-mission-void' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
