interface StandBadgeProps {
  kind: 'official' | 'projection';
  /** e.g. the Power BI snapshot date, or "+1,40 FTE open bonnen". */
  detail?: string;
}

/** Marks a block as the official Power BI stand or as a projection — the
 * two are never shown without one of these, so they can't be mixed up. */
export function StandBadge({ kind, detail }: StandBadgeProps) {
  const official = kind === 'official';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
        official ? 'border-gold/40 bg-gold/10 text-gold' : 'border-dashed border-intel/60 bg-intel/10 text-intel'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${official ? 'bg-gold' : 'bg-intel'}`} aria-hidden />
      {official ? 'Officieel' : 'Projectie'}
      {detail && <span className="font-normal normal-case tracking-normal opacity-80">· {detail}</span>}
    </span>
  );
}
