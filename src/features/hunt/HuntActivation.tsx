import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { softAssetUrl } from '../../components/softAssets';
import { GoldConfetti } from './GoldConfetti';

interface HuntActivationProps {
  onDone: () => void;
}

/**
 * The switch-on moment for HUNT MODE: the gold flash + confetti burst with
 * a target-lock stamp on top — a crosshair snapping in and MISSION
 * ACTIVATED. Pure transform/opacity; GoldConfetti ends it (~2s) and the
 * parent unmounts it. With reduced motion only the (static, instant)
 * finish remains.
 */
export function HuntActivation({ onDone }: HuntActivationProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <>
      <GoldConfetti onDone={onDone} />
      {!reduced && (
        <div className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center" aria-hidden data-testid="hunt-activation">
          <div className="relative flex animate-activation-stamp flex-col items-center text-center">
            <img src={softAssetUrl('soft-crosshair')} alt="" className="absolute left-1/2 top-1/2 w-[340px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 opacity-90 sm:w-[420px]" />
            <p className="relative font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gold-bright">Target locked</p>
            <p className="relative mt-2 bg-black/55 px-4 py-1 font-display text-4xl font-black uppercase tracking-[0.08em] text-ink shadow-gold-lg sm:text-6xl">
              Mission activated
            </p>
          </div>
        </div>
      )}
    </>
  );
}
