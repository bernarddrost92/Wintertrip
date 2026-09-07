import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_CLASSES: Record<NonNullable<GoldButtonProps['variant']>, string> = {
  primary:
    'bg-gold-sweep bg-[length:200%_auto] text-mission-void shadow-gold hover:bg-[position:100%_50%] hover:shadow-gold-lg',
  ghost:
    'border border-gold/40 bg-transparent text-gold hover:border-gold hover:bg-gold/10',
  subtle:
    'border border-white/10 bg-mission-raised text-ink hover:border-gold/40 hover:text-gold',
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
      className={`inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition-all duration-300 ease-out focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span aria-hidden>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span aria-hidden>{icon}</span>}
    </button>
  );
}
