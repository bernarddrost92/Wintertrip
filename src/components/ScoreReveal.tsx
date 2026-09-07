import { useCountUp } from '../hooks/useCountUp';
import { formatPoints } from '../utils/format';

interface ScoreRevealProps {
  label: string;
  value: number;
  suffix?: string;
}

export function ScoreReveal({ label, value, suffix = 'PUNTEN' }: ScoreRevealProps) {
  const animated = useCountUp(value);

  return (
    <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-mission-raised px-6 py-8 text-center shadow-gold-lg sm:px-10 sm:py-10">
      <div className="absolute inset-0 bg-panel-glow" aria-hidden />
      <p className="label-classified relative text-gold/80">{label}</p>
      <p className="relative mt-3 font-display text-6xl font-bold tabular-nums text-gold-gradient bg-[length:200%_auto] animate-gold-sweep-move sm:text-8xl">
        {formatPoints(animated)}
      </p>
      <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">{suffix}</p>
    </div>
  );
}
