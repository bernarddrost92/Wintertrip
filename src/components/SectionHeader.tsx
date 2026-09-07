interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({ eyebrow, title, subtitle, align = 'left' }: SectionHeaderProps) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      {eyebrow && <p className="label-classified mb-2">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold uppercase tracking-wide text-ink sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">{subtitle}</p>}
    </div>
  );
}
