import type { ReactNode } from 'react';

interface MissionCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  badge?: string;
  className?: string;
}

export function MissionCard({
  icon,
  title,
  description,
  selected = false,
  disabled = false,
  onClick,
  badge,
  className = '',
}: MissionCardProps) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={interactive ? selected : undefined}
      className={`group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-lg border p-5 text-left transition-all duration-300 ${
        selected
          ? 'border-gold bg-mission-raised shadow-gold'
          : 'border-white/10 bg-mission-panel/70 hover:border-gold/50 hover:bg-mission-raised'
      } ${disabled ? 'cursor-not-allowed opacity-40' : interactive ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-panel-glow opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {badge && (
        <span className="label-classified relative rounded-full border border-gold/30 px-2 py-0.5 text-gold">
          {badge}
        </span>
      )}
      {icon && (
        <span
          className={`relative flex h-11 w-11 items-center justify-center rounded-md border ${
            selected ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-mission-void text-ink-muted group-hover:text-gold'
          }`}
        >
          {icon}
        </span>
      )}
      <div className="relative">
        <h3 className={`text-lg font-semibold uppercase tracking-wide ${selected ? 'text-gold' : 'text-ink'}`}>
          {title}
        </h3>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
    </button>
  );
}
