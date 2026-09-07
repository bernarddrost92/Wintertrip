import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface MissionIntroSequenceProps {
  onComplete: () => void;
}

const BLADE_COUNT = 14;
const BLADE_ANGLES = Array.from({ length: BLADE_COUNT }, (_, i) => (i * 360) / BLADE_COUNT);
const FLASH_SPIKE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const FULL_DURATION_MS = 3750;
const REDUCED_DURATION_MS = 700;

/**
 * An original gold-on-black gun-barrel/iris opening — a metallic barrel
 * with rotating bevelled blades, a generic tuxedo silhouette that turns
 * through three poses (profile -> three-quarter -> front with a raised
 * arm), a starburst muzzle flash, and a liquid-gold iris wipe into
 * "MISSION ACCEPTED". Built entirely from SVG primitives, gradients and
 * CSS keyframes in the app's own gold/black palette — nothing here is
 * copied from any studio's actual title sequence, logo or photography.
 */
export function MissionIntroSequence({ onComplete }: MissionIntroSequenceProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onComplete, reducedMotion ? REDUCED_DURATION_MS : FULL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, onComplete]);

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-mission-void px-4 text-center animate-[intro-quickfade_0.35s_ease-out_both]">
        <p className="font-display text-2xl font-bold tracking-[0.1em] text-ink">007</p>
        <p className="bg-gold-sweep bg-clip-text font-display text-lg font-bold uppercase tracking-[0.08em] text-transparent">
          Operatie Wintersport 2027
        </p>
        <p className="mt-5 animate-[intro-approved_0.4s_ease-out_0.3s_both] font-display text-xl font-bold uppercase tracking-[0.2em] text-gold drop-shadow-[0_0_24px_rgba(255,215,104,0.5)]">
          Mission Accepted
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-mission-void">
      {/* Ambient depth: a warm glow seated behind everything, plus a
          cinematic vignette pulling focus toward the barrel. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 46%, rgba(227,178,60,0.16), transparent 60%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 65% at 50% 46%, rgba(3,4,5,0) 45%, rgba(3,4,5,0.7) 100%)' }}
        aria-hidden
      />

      {/* Fase 1 — classified header, then the mission title, which holds. */}
      <div className="absolute left-1/2 top-[11%] -translate-x-1/2 text-center sm:top-[14%]">
        <p className="animate-[intro-textfade_0.75s_ease-out_0s_both] font-mono text-[10px] uppercase tracking-[0.5em] text-gold/70 sm:text-[11px]">
          Classified
        </p>
        <p className="animate-[intro-textfade_0.75s_ease-out_0s_both] mt-1 font-mono text-[9px] uppercase tracking-[0.4em] text-ink-muted sm:text-[10px]">
          Team Zwolle
        </p>
        <p className="animate-[intro-textfade-hold_0.55s_ease-out_0.55s_both] mt-4 font-display text-2xl font-bold tracking-[0.1em] text-ink drop-shadow-[0_0_18px_rgba(255,215,104,0.3)] sm:text-3xl">
          007
        </p>
        <p className="animate-[intro-textfade-hold_0.55s_ease-out_0.55s_both] bg-gold-sweep bg-[length:200%_auto] bg-clip-text font-display text-base font-bold uppercase tracking-[0.08em] text-transparent drop-shadow-[0_0_18px_rgba(255,215,104,0.35)] sm:text-xl">
          Operatie Wintersport 2027
        </p>
      </div>

      {/* Fase 2 + 3 — the metallic barrel: bezel with a gradient sheen,
          bevelled rotating blades, a bright golden aperture holding a
          silhouette that turns through three poses and raises an arm
          toward camera, then a starburst flash. Fase 4 — the assembly
          closes while a liquid-gold wipe floods the screen and recedes. */}
      <svg viewBox="0 0 400 400" className="h-[230px] w-[230px] sm:h-[320px] sm:w-[320px]" aria-hidden>
        <defs>
          <linearGradient id="introRingGrad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#B8862A" />
            <stop offset="45%" stopColor="#FFD768" />
            <stop offset="100%" stopColor="#B8862A" />
          </linearGradient>
          <radialGradient id="introIrisBright" cx="44%" cy="36%" r="72%">
            <stop offset="0%" stopColor="#FFE38A" />
            <stop offset="42%" stopColor="#F1C453" />
            <stop offset="100%" stopColor="#8A611D" />
          </radialGradient>
          <radialGradient id="introFlashCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF6DF" />
            <stop offset="45%" stopColor="#FFD768" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFD768" stopOpacity="0" />
          </radialGradient>
          <clipPath id="introIrisClip">
            <circle cx="200" cy="200" r="104" />
          </clipPath>
        </defs>

        {/* Outer ambient bloom seated behind the barrel's own glow. */}
        <circle cx="200" cy="200" r="140" fill="#F1C453" opacity="0.18" style={{ filter: 'blur(26px)' }} />

        <g className="animate-[intro-barrel-life_2.05s_ease-in-out_0.8s_both]" style={{ transformOrigin: '200px 200px' }}>
          <circle cx="200" cy="200" r="172" fill="none" stroke="url(#introRingGrad)" strokeOpacity="0.55" strokeWidth="3" />
          <circle cx="200" cy="200" r="152" fill="none" stroke="url(#introRingGrad)" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="132" fill="none" stroke="#FFD768" strokeOpacity="0.18" strokeWidth="1" />

          <g className="animate-[intro-rotate-partial_1.65s_ease-out_0.9s_both]" style={{ transformOrigin: '200px 200px' }}>
            {BLADE_ANGLES.map((angle) => (
              <g key={angle} transform={`rotate(${angle} 200 200)`}>
                <rect x="194" y="110" width="12" height="42" fill="#8A611D" opacity="0.75" />
                <rect x="194" y="110" width="4" height="42" fill="#FFD768" opacity="0.55" />
              </g>
            ))}
          </g>

          <circle cx="200" cy="200" r="104" fill="url(#introIrisBright)" />

          <g clipPath="url(#introIrisClip)">
            <g className="animate-[intro-pushin_0.55s_ease-in_1.7s_both]" style={{ transformOrigin: '200px 220px' }}>
              {/* Pose A — side profile, screen-right-of-centre. */}
              <g className="animate-[intro-crossfade-out_0.45s_ease-in-out_1.2s_both]">
                <circle cx="225" cy="150" r="15" fill="#150F07" stroke="#FFD768" strokeOpacity="0.5" strokeWidth="1.5" />
                <path
                  d="M209,168 Q198,192 204,232 L214,292 L236,292 L240,224 Q246,192 235,168 Z"
                  fill="#150F07"
                  stroke="#FFD768"
                  strokeOpacity="0.4"
                  strokeWidth="1.25"
                />
              </g>

              {/* Pose B — three-quarter turn. */}
              <g className="animate-[intro-pose-mid_1s_ease-in-out_1.2s_both]">
                <circle cx="230" cy="150" r="15" fill="#150F07" stroke="#FFD768" strokeOpacity="0.5" strokeWidth="1.5" />
                <path
                  d="M205,168 L245,168 L251,230 L241,292 L219,292 L209,230 Z"
                  fill="#150F07"
                  stroke="#FFD768"
                  strokeOpacity="0.42"
                  strokeWidth="1.25"
                />
              </g>

              {/* Pose C — front-on, arm raised toward camera; holds once in. */}
              <g className="animate-[intro-crossfade-in_0.45s_ease-in-out_1.85s_both]">
                <circle cx="228" cy="150" r="15" fill="#150F07" stroke="#FFE38A" strokeOpacity="0.6" strokeWidth="1.5" />
                <path
                  d="M207,168 L249,168 L256,230 L245,292 L211,292 L200,230 Z"
                  fill="#150F07"
                  stroke="#FFE38A"
                  strokeOpacity="0.5"
                  strokeWidth="1.25"
                />
                <path d="M213,180 L168,198 L172,212 L221,196 Z" fill="#150F07" stroke="#FFE38A" strokeOpacity="0.55" strokeWidth="1.25" />
              </g>
            </g>
          </g>

          {/* Starburst muzzle flash, at the raised arm's tip. */}
          <circle cx="168" cy="202" r="34" fill="url(#introFlashCore)" className="animate-[intro-flash-burst_0.4s_ease-out_2.15s_both]" />
          <g className="animate-[intro-flash-spikes_0.4s_ease-out_2.15s_both]" style={{ transformOrigin: '168px 202px' }}>
            {FLASH_SPIKE_ANGLES.map((angle) => (
              <rect key={angle} x="166" y="172" width="4" height="30" fill="#FFE38A" transform={`rotate(${angle} 168 202)`} />
            ))}
          </g>
        </g>
      </svg>

      {/* Fase 4 — a brief light pulse, then a liquid-gold circle floods the
          screen and recedes, revealing MISSION ACCEPTED once it clears. */}
      <div className="pointer-events-none absolute inset-0 bg-gold-light animate-[intro-screen-flash_0.28s_ease-in-out_2.15s_both]" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2 rounded-full animate-[intro-gold-wipe_0.6s_ease-in-out_2.55s_both]"
        style={{ background: 'radial-gradient(circle, #FFD768 0%, #F1C453 45%, #B8862A 100%)' }}
        aria-hidden
      />

      <p className="animate-[intro-approved_0.45s_ease-out_3.15s_both] absolute px-4 text-center font-display text-lg font-bold uppercase tracking-[0.16em] text-gold drop-shadow-[0_0_28px_rgba(255,215,104,0.55)] sm:text-2xl sm:tracking-[0.2em] lg:text-3xl">
        Mission Accepted
      </p>
    </div>
  );
}
