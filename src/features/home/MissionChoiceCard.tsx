import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MissionChoiceCardProps {
  code: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: LucideIcon;
  onClick: () => void;
  size?: 'lg' | 'md';
  /** Compact status pill next to the icon — e.g. "1 UPDATE". Never a loud
   * badge; same restrained mono/uppercase treatment as the rest of the card. */
  badge?: string;
}

/** A "mission terminal", not a web card — the primary way in and out of
 * each operation from the briefing page. Matte card, a short gold accent
 * line instead of a gold frame; only the primary (large) choice gets a gold
 * call to action. */
export function MissionChoiceCard({ code, title, subtitle, cta, icon: Icon, onClick, size = 'md', badge }: MissionChoiceCardProps) {
  const isLarge = size === 'lg';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mission-card-calm mission-accent-line group flex w-full flex-col overflow-hidden text-left transition-colors duration-200 hover:border-white/[0.16] hover:bg-mission-soft ${
        isLarge ? 'px-7 py-9 sm:px-12 sm:py-12' : 'px-6 py-7 sm:px-7 sm:py-8'
      }`}
    >
      <div className="relative flex items-start justify-between">
        <span className={`font-mono font-bold uppercase tracking-[0.25em] text-ink-dim ${isLarge ? 'text-sm' : 'text-xs'}`}>{code}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="border border-white/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink-muted">
              {badge}
            </span>
          )}
          <Icon className="text-gold/70 transition-colors duration-200 group-hover:text-gold" size={isLarge ? 26 : 20} aria-hidden />
        </div>
      </div>

      <p className={`relative mt-4 font-display font-bold uppercase leading-tight tracking-[0.02em] text-ink ${isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
        {title}
      </p>
      <p className={`relative mt-2 text-ink-muted ${isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>{subtitle}</p>

      <span
        className={`relative mt-7 inline-flex w-fit items-center gap-2 font-mono font-bold uppercase tracking-[0.2em] transition-colors duration-200 ${
          isLarge
            ? 'bg-gold px-5 py-2.5 text-xs text-mission-deep group-hover:bg-gold-bright'
            : 'text-[10px] text-ink-muted group-hover:text-gold'
        }`}
      >
        {cta}
        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
}
