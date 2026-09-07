import { CalendarPlus, Clock4, RefreshCw } from 'lucide-react';
import type { MissionType } from '../../types/scoring';

const OPTIONS: { type: MissionType; label: string; icon: typeof CalendarPlus }[] = [
  { type: 'NEW_PLACEMENT', label: 'Nieuwe plaatsing', icon: CalendarPlus },
  { type: 'EXTENSION', label: 'Verlenging', icon: RefreshCw },
  { type: 'HOURS_INCREASE', label: 'Urenuitbreiding', icon: Clock4 },
];

interface MissionTypeToggleProps {
  value: MissionType;
  onChange: (type: MissionType) => void;
}

export function MissionTypeToggle({ value, onChange }: MissionTypeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Mission type" className="grid grid-cols-1 border border-gold/20 bg-mission-panel sm:grid-cols-3">
      {OPTIONS.map(({ type, label, icon: Icon }, i) => {
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type)}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-200 sm:py-3.5 sm:text-sm ${
              i > 0 ? 'border-t border-gold/15 sm:border-l sm:border-t-0' : ''
            } ${selected ? 'bg-gold text-mission-void' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'}`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
