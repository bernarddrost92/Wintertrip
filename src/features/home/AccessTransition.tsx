interface AccessTransitionProps {
  label: string;
}

/** A brief (≤800ms) full-screen beat between the mission briefing and a
 * section — a sweeping gold line and a status line, not a loading spinner. */
export function AccessTransition({ label }: AccessTransitionProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mission-void/92 backdrop-blur-sm animate-[intro-quickfade_0.12s_ease-out_both]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-px w-56 overflow-hidden bg-white/10 sm:w-72">
          <div className="h-full w-1/3 bg-gold-sweep bg-[length:200%_auto] animate-gold-sweep-move" />
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.35em] text-gold">{label}</p>
      </div>
    </div>
  );
}
