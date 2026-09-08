import { useEffect, useRef } from 'react';
import { SkipForward } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { withBase } from '../../utils/assetPath';

interface MissionIntroSequenceProps {
  onComplete: () => void;
}

const FULL_DURATION_MS = 3600;
const REDUCED_DURATION_MS = 700;

const SHOT_READY = withBase('intro/intro-agent-ready.webp');
const SHOT_AIM = withBase('intro/intro-agent-aim.webp');
const SHOT_ACCEPTED = withBase('intro/intro-mission-accepted.webp');

/**
 * The three supplied production stills, played as a short cinematic
 * sequence: profile with the weapon raised -> aiming straight at camera ->
 * close-up impact with the "Mission Accepted" text baked into the photo.
 * Crossfades and a slow Ken-Burns zoom are done purely with layered <img>
 * elements and CSS keyframes — no redrawing of the supplied artwork.
 */
export function MissionIntroSequence({ onComplete }: MissionIntroSequenceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(complete, reducedMotion ? REDUCED_DURATION_MS : FULL_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  function complete() {
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete();
  }

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    complete();
  }

  const skipButton = (
    <button
      type="button"
      onClick={handleSkip}
      className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 border border-gold/25 bg-mission-void/50 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted/80 backdrop-blur-sm transition-colors duration-150 hover:border-gold/50 hover:text-gold sm:bottom-6 sm:right-6"
    >
      Skip Intro
      <SkipForward size={11} aria-hidden />
    </button>
  );

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-mission-void" aria-hidden>
        <img src={SHOT_READY} alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_42%] animate-[photo-reduced-fade_0.4s_ease-out_0.25s_both]" />
        <img src={SHOT_ACCEPTED} alt="" className="absolute inset-0 h-full w-full object-contain sm:object-cover animate-[intro-quickfade_0.35s_ease-out_0.25s_both]" />
        {skipButton}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-mission-void">
      <div className="absolute inset-0 animate-[photo-camera-shake_0.25s_ease-in-out_2.15s_both]">
        <img
          src={SHOT_READY}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[70%_42%] animate-[photo-shot-one_1300ms_ease-out_0ms_both]"
        />
        <img
          src={SHOT_AIM}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[64%_40%] animate-[photo-shot-two_1300ms_ease-out_1000ms_both]"
        />
        <img
          src={SHOT_ACCEPTED}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain object-center sm:object-cover animate-[photo-shot-three_1600ms_ease-out_2000ms_both]"
        />
      </div>

      {/* Subtle cinematic dressing over the photography — vignette, a warm
          gold gradient, and a faint scan-line grain. The images stay the
          dominant visual; nothing here is a heavy UI element. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 70% at 50% 45%, rgba(3,4,5,0) 40%, rgba(3,4,5,0.75) 100%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(3,4,5,0.35) 0%, transparent 22%, transparent 75%, rgba(3,4,5,0.45) 100%)' }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-scan-lines opacity-40" aria-hidden />

      {/* Impact flash right as shot 3 lands. */}
      <div className="pointer-events-none absolute inset-0 bg-gold-light animate-[photo-flash-pulse_0.25s_ease-in-out_2.15s_both]" aria-hidden />

      {/* Gold flood — expands to fully cover the screen, then the whole
          sequence unmounts as the Mission Homepage takes over underneath. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] rounded-full animate-[photo-gold-flood_550ms_ease-in-out_3050ms_both]"
        style={{ background: 'radial-gradient(circle, #FFD768 0%, #F1C453 45%, #B8862A 100%)' }}
        aria-hidden
      />

      {skipButton}
    </div>
  );
}
