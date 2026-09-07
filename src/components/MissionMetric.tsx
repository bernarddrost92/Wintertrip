interface MissionMetricProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'gold' | 'muted';
  size?: 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<MissionMetricProps['size']>, string> = {
  md: 'text-3xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-6xl sm:text-7xl',
};

const TONE_CLASSES: Record<NonNullable<MissionMetricProps['tone']>, string> = {
  default: 'text-ink',
  gold: 'text-gold-gradient animate-gold-sweep-move',
  muted: 'text-ink-muted',
};

export function MissionMetric({ label, value, sub, tone = 'default', size = 'md' }: MissionMetricProps) {
  return (
    <div>
      <p className="label-classified">{label}</p>
      <p className={`mt-1 font-display font-semibold tabular-nums leading-none ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}
