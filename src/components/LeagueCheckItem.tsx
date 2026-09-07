import { Check } from 'lucide-react';

interface LeagueCheckItemProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

export function LeagueCheckItem({ id, label, checked, onToggle }: LeagueCheckItemProps) {
  return (
    <li>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors duration-200 ${
          checked ? 'border-gold/40 bg-gold/5' : 'border-white/10 bg-mission-raised/50 hover:border-white/20'
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-200 ${
            checked ? 'border-gold bg-gold text-mission-void' : 'border-white/30 text-transparent'
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </span>
        <span className={`text-sm ${checked ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
      </label>
    </li>
  );
}
