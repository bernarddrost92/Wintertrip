import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface MissionIntroSequenceProps {
  onComplete: () => void;
}

const BLADE_COUNT = 14;
const BLADE_ANGLES = Array.from({ length: BLADE_COUNT }, (_, i) => (i * 360) / BLADE_COUNT);

const FULL_DURATION_MS = 3500;
const REDUCED_DURATION_MS = 700;

/**
 * An original gun-barrel/iris opening sequence — a wall of blades around a
 * bright aperture, a generic tuxedo silhouette that turns toward camera, a
 * stylised flash, then an iris-close wipe into "MISSION ACCEPTED". Built
 * entirely from SVG primitives and CSS keyframes; nothing here is copied
 * from any studio's actual title sequence or logo.
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
        <p className="font-display text-lg font-bold uppercase tracking-[0.08em] text-gold">Operatie Wintersport 2027</p>
        <p className="mt-5 animate-[intro-approved_0.4s_ease-out_0.3s_both] font-display text-xl font-bold uppercase tracking-[0.2em] text-gold">
          Mission Accepted
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-mission-void">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 46%, rgba(227,178,60,0.12), transparent 62%)' }}
        aria-hidden
      />

      {/* Fase 1 — classified header, then the mission title, which holds. */}
      <div className="absolute left-1/2 top-[12%] -translate-x-1/2 text-center sm:top-[15%]">
        <p className="animate-[intro-textfade_0.8s_ease-out_0s_both] font-mono text-[10px] uppercase tracking-[0.5em] text-gold/70 sm:text-[11px]">
          Classified
        </p>
        <p className="animate-[intro-textfade_0.8s_ease-out_0s_both] mt-1 font-mono text-[9px] uppercase tracking-[0.4em] text-ink-muted sm:text-[10px]">
          Team Zwolle
        </p>
        <p className="animate-[intro-textfade-hold_0.6s_ease-out_0.55s_both] mt-4 font-display text-2xl font-bold tracking-[0.1em] text-ink sm:text-3xl">
          007
        </p>
        <p className="animate-[intro-textfade-hold_0.6s_ease-out_0.55s_both] font-display text-base font-bold uppercase tracking-[0.08em] text-gold sm:text-xl">
          Operatie Wintersport 2027
        </p>
      </div>

      {/* Fase 2 + 3 — the barrel: bezel, rotating blades, the bright
          aperture with a silhouette that turns, and a flash right as it
          does. Fase 4 — the whole assembly closes to a point (iris wipe). */}
      <svg viewBox="0 0 400 400" className="h-[230px] w-[230px] sm:h-[320px] sm:w-[320px]" aria-hidden>
        <defs>
          <radialGradient id="introIrisBright" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#FFF6DF" />
            <stop offset="55%" stopColor="#F1C453" />
            <stop offset="100%" stopColor="#B8862A" />
          </radialGradient>
          <radialGradient id="introFlash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF6DF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFF6DF" stopOpacity="0" />
          </radialGradient>
          <clipPath id="introIrisClip">
            <circle cx="200" cy="200" r="104" />
          </clipPath>
        </defs>

        <g className="animate-[intro-barrel-life_2.1s_ease-in-out_0.9s_both]" style={{ transformOrigin: '200px 200px' }}>
          <circle cx="200" cy="200" r="170" fill="none" stroke="#E3B23C" strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="#E3B23C" strokeOpacity="0.25" strokeWidth="1" />

          <g className="animate-[intro-rotate-partial_1.5s_ease-out_1s_both]" style={{ transformOrigin: '200px 200px' }}>
            {BLADE_ANGLES.map((angle) => (
              <rect
                key={angle}
                x="196"
                y="112"
                width="8"
                height="40"
                fill="#E3B23C"
                opacity="0.55"
                transform={`rotate(${angle} 200 200)`}
              />
            ))}
          </g>

          <circle cx="200" cy="200" r="104" fill="url(#introIrisBright)" />

          <g clipPath="url(#introIrisClip)">
            {/* Generic tuxedo silhouette, side profile — turns to face camera. */}
            <g className="animate-[intro-crossfade-out_0.9s_ease-in-out_1.35s_both]">
              <circle cx="185" cy="150" r="15" fill="#0A0B0D" />
              <path d="M169,168 Q158,192 164,232 L174,292 L196,292 L200,224 Q206,192 195,168 Z" fill="#0A0B0D" />
            </g>
            <g className="animate-[intro-crossfade-in_0.9s_ease-in-out_1.35s_both]">
              <circle cx="200" cy="150" r="15" fill="#0A0B0D" />
              <path d="M175,168 L225,168 L233,230 L221,292 L179,292 L167,230 Z" fill="#0A0B0D" />
            </g>
          </g>

          <circle
            cx="200"
            cy="200"
            r="130"
            fill="url(#introFlash)"
            className="animate-[intro-flash_0.3s_ease-in-out_1.85s_both]"
          />
        </g>
      </svg>

      <p className="animate-[intro-approved_0.45s_ease-out_3s_both] absolute font-display text-2xl font-bold uppercase text-gold sm:text-3xl">
        Mission Accepted
      </p>
    </div>
  );
}
