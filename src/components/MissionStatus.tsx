import { CheckCircle2, ShieldAlert, Radio } from 'lucide-react';

type StatusKind = 'approved' | 'review' | 'active';

interface MissionStatusProps {
  kind: StatusKind;
  label?: string;
}

const CONFIG: Record<StatusKind, { text: string; classes: string; icon: typeof CheckCircle2 }> = {
  approved: {
    text: 'MISSION APPROVED',
    classes: 'border-gold bg-gold/10 text-gold shadow-gold',
    icon: CheckCircle2,
  },
  review: {
    text: 'REVIEW REQUIRED',
    classes: 'border-white/20 bg-mission-raised text-ink-muted',
    icon: ShieldAlert,
  },
  active: {
    text: 'MISSION STATUS: ACTIVE',
    classes: 'border-gold/40 bg-mission-raised text-gold',
    icon: Radio,
  },
};

export function MissionStatus({ kind, label }: MissionStatusProps) {
  const { text, classes, icon: Icon } = CONFIG[kind];
  return (
    <span
      className={`inline-flex items-center gap-2 border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${classes} ${
        kind === 'approved' ? 'animate-rise-in' : ''
      }`}
    >
      <Icon size={14} aria-hidden />
      {label ?? text}
    </span>
  );
}
