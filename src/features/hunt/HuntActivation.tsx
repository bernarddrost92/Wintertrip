import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { softAssetUrl } from '../../components/softAssets';
import { GoldConfetti } from './GoldConfetti';
import './hunt3.css';

/** When the gold burst starts within the activation (ms). */
export const ACTIVATION_CONFETTI_MS = 900;

interface HuntActivationProps {
  onDone: () => void;
}

/**
 * The switch-on moment for HUNT MODE — one continuous CSS timeline (all
 * transform/opacity, timed with animation-delay, no chain of timers):
 *
 *   0.00–0.25s  the normal app dims
 *   0.25–0.80s  crosshair snaps in · TARGET LOCKED
 *   0.80–1.35s  MISSION ACTIVATED
 *   0.90–1.80s  gold flash + confetti
 *   1.45–1.80s  the Hunt Room fades in underneath the dim
 *   1.60–2.00s  the dim lifts — the room is already there, the app never
 *               shows through again (entry delays: huntTimeline.ts)
 *
 * GoldConfetti ends it and the parent unmounts it. With reduced motion
 * nothing is shown and it finishes immediately — Hunt Mode then simply
 * appears, fully visible.
 */
export function HuntActivation({ onDone }: HuntActivationProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <>
      {!reduced && (
        <div className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center" aria-hidden data-testid="hunt-activation">
          <div className="hunt3-act-dim absolute inset-0 bg-[#05070a]" />
          <div className="relative flex flex-col items-center text-center">
            <div className="hunt3-act-lock flex flex-col items-center">
              <img src={softAssetUrl('soft-crosshair')} alt="" className="absolute left-1/2 top-1/2 w-[340px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 opacity-90 sm:w-[420px]" />
              <p className="relative font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gold-bright">Target locked</p>
            </div>
            <p className="hunt3-act-activated relative mt-2 bg-black/55 px-4 py-1 font-display text-4xl font-black uppercase tracking-[0.08em] text-ink shadow-gold-lg sm:text-6xl">
              Mission activated
            </p>
          </div>
        </div>
      )}
      <GoldConfetti onDone={onDone} delayMs={ACTIVATION_CONFETTI_MS} />
    </>
  );
}
