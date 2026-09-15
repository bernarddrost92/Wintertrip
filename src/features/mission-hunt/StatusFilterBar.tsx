import { STATUS_ICON, STATUS_LABEL, STATUS_ORDER } from '../../services/missionHuntStatus';
import type { ProjectStatus } from '../../types/missionHunt';

interface StatusFilterBarProps {
  value: ProjectStatus | 'all';
  onChange: (value: ProjectStatus | 'all') => void;
}

/** ALL / KANS / UITZOEKEN / GEEN ACTIE / NOG BEOORDELEN — for scanning one
 * status at a time during the Friday sales meeting (spec section 25/26). */
export function StatusFilterBar({ value, onChange }: StatusFilterBarProps) {
  return (
    <div role="group" aria-label="Filter op status" className="flex flex-wrap gap-1.5">
      <FilterChip label="ALL" active={value === 'all'} onClick={() => onChange('all')} />
      {STATUS_ORDER.map((status) => (
        <FilterChip key={status} label={`${STATUS_ICON[status]} ${STATUS_LABEL[status]}`} active={value === status} onClick={() => onChange(status)} />
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
        active ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-ink-muted hover:border-white/30'
      }`}
    >
      {label}
    </button>
  );
}
