import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_CLASSES: Record<NonNullable<GoldButtonProps['variant']>, string> = {
  primary:
    'bg-gold text-mission-deep shadow-calm hover:bg-gold-bright',
  ghost:
    'border border-gold/35 bg-transparent text-gold hover:border-gold/70 hover:bg-gold/[0.06]',
  subtle:
    'border border-white/10 bg-mission-raised text-ink hover:border-white/25',
};

export function GoldButton({
  variant = 'primary',
  icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}: GoldButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ease-out focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span aria-hidden>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span aria-hidden>{icon}</span>}
    </button>
  );
}
