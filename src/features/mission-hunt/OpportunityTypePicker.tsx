import { OPPORTUNITY_TYPE_LABEL, OPPORTUNITY_TYPE_ORDER } from '../../services/missionHuntStatus';
import type { OpportunityType } from '../../types/missionHunt';

interface OpportunityTypePickerProps {
  selected: OpportunityType[];
  onChange: (next: OpportunityType[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select chips for "WAAR ZIT DE KANS?" — deliberately never required:
 * a status save must never be blocked waiting on this, per spec section 19.
 */
export function OpportunityTypePicker({ selected, onChange, disabled = false }: OpportunityTypePickerProps) {
  function toggle(type: OpportunityType) {
    if (disabled) return;
    onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]);
  }

  return (
    <div>
      <p className="label-classified mb-2">Waar zit de kans?</p>
      <div className="flex flex-wrap gap-1.5">
        {OPPORTUNITY_TYPE_ORDER.map((type) => {
          const active = selected.includes(type);
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => toggle(type)}
              aria-pressed={active}
              className={`border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 bg-transparent text-ink-muted hover:border-white/30'
              }`}
            >
              {OPPORTUNITY_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
