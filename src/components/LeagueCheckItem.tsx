import { Check } from 'lucide-react';

interface LeagueCheckItemProps {
  id: string;
  code: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

/** One compact tactical row: a mission code, a thin gold rule, and the
 * question as a smaller description line underneath — not a large empty
 * card. Ten of these stack far tighter than the old checkbox grid. */
export function LeagueCheckItem({ id, code, label, checked, onToggle }: LeagueCheckItemProps) {
  return (
    <li>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 border-b border-gold/10 px-3 py-2.5 transition-colors duration-200 ${
          checked ? 'bg-gold/[0.06]' : 'hover:bg-white/[0.02]'
        }`}
      >
        <input id={id} type="checkbox" checked={checked} onChange={() => onToggle(id)} className="peer sr-only" />
        <span
          aria-hidden
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-200 ${
            checked ? 'border-gold bg-gold text-mission-void' : 'border-white/25 text-transparent'
          }`}
        >
          <Check size={11} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${checked ? 'text-gold' : 'text-gold/45'}`}>
              {code}
            </span>
            <span className={`h-px flex-1 ${checked ? 'bg-gold/35' : 'bg-white/10'}`} aria-hidden />
          </span>
          <span className={`mt-1 block text-[12.5px] leading-snug ${checked ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
        </span>
      </label>
    </li>
  );
}
