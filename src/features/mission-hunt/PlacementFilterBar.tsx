import { FILTER_LABEL, FILTER_ORDER, type PlacementFilter } from '../../services/missionHuntOpportunity';

interface PlacementFilterBarProps {
  value: PlacementFilter;
  onChange: (value: PlacementFilter) => void;
}

/** ALLE KANSEN / DOUBLE / VERLENGEN / TIMING / GRIJS / ALLE PLAATSINGEN. */
export function PlacementFilterBar({ value, onChange }: PlacementFilterBarProps) {
  return (
    <div role="group" aria-label="Filter op kans" className="flex flex-wrap gap-1.5">
      {FILTER_ORDER.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          aria-pressed={value === filter}
          className={`border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
            value === filter ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-ink-muted hover:border-white/30'
          }`}
        >
          {FILTER_LABEL[filter]}
        </button>
      ))}
    </div>
  );
}
