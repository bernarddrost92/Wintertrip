import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { HudCorners } from '../../components/HudCorners';
import { TacticalGrid } from '../../components/TacticalGrid';

interface MissionChoiceCardProps {
  code: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: LucideIcon;
  onClick: () => void;
  size?: 'lg' | 'md';
}

/** A "mission terminal", not a web card — the primary way in and out of
 * each operation from the briefing page. */
export function MissionChoiceCard({ code, title, subtitle, cta, icon: Icon, onClick, size = 'md' }: MissionChoiceCardProps) {
  const isLarge = size === 'lg';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden border border-gold/20 bg-mission-panel/70 text-left backdrop-blur-sm transition-all duration-200 hover:border-gold/50 hover:bg-mission-panel/90 hover:shadow-gold-lg ${
        isLarge ? 'px-8 py-10 sm:px-12 sm:py-12' : 'px-6 py-8'
      }`}
    >
      <HudCorners />
      <TacticalGrid className="opacity-15 transition-opacity duration-200 group-hover:opacity-30" />

      <div className="relative flex items-start justify-between">
        <span className={`font-mono font-bold uppercase tracking-[0.25em] text-gold/50 ${isLarge ? 'text-sm' : 'text-xs'}`}>{code}</span>
        <Icon className="text-gold/60 transition-colors duration-200 group-hover:text-gold" size={isLarge ? 26 : 20} aria-hidden />
      </div>

      <p className={`relative mt-4 font-display font-bold uppercase leading-tight tracking-[0.02em] text-ink ${isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
        {title}
      </p>
      <p className={`relative mt-2 text-ink-muted ${isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>{subtitle}</p>

      <span
        className={`relative mt-6 inline-flex w-fit items-center gap-2 border border-gold/30 px-4 py-2 font-mono font-bold uppercase tracking-[0.2em] text-gold transition-colors duration-200 group-hover:border-gold group-hover:bg-gold/10 ${
          isLarge ? 'text-xs' : 'text-[10px]'
        }`}
      >
        {cta}
        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
}
