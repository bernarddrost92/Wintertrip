/**
 * Full-viewport cinematic background: an original, non-photographic
 * "secret intelligence operations room" built entirely from SVG primitives
 * — a wall-mounted globe/radar display, workstation consoles with glowing
 * monitors on both flanks, subtle analyst silhouettes, atmospheric haze and
 * a warm focal glow behind where the central command screen sits. No
 * third-party or copyrighted imagery is used anywhere in this file.
 *
 * Composition note: the workstation clusters sit close to the extreme left
 * and right edges of the 1920-wide scene on purpose — the command screen in
 * front of them is capped at max-w-[1240px] (see CommandFrame), so this is
 * the band of scene that actually stays visible beside it rather than being
 * covered. The globe/radar wall stays dead-center: it sits directly behind
 * the glass panel and its glow bleeds through the panel's backdrop-blur as
 * ambient light rather than being seen outright.
 */

interface Monitor {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
}

interface Silhouette {
  cx: number;
  cy: number;
  scale: number;
  opacity: number;
}

const LEFT_MONITORS: Monitor[] = [
  { x: 70, y: 700, w: 58, h: 44, opacity: 0.95 },
  { x: 150, y: 686, w: 64, h: 48, opacity: 1 },
  { x: 232, y: 700, w: 58, h: 44, opacity: 0.95 },
  { x: 40, y: 556, w: 42, h: 32, opacity: 0.7 },
  { x: 96, y: 548, w: 42, h: 32, opacity: 0.7 },
];

const RIGHT_MONITORS: Monitor[] = LEFT_MONITORS.map((m) => ({ ...m, x: 1920 - m.x - m.w }));

const LEFT_SILHOUETTES: Silhouette[] = [
  { cx: 130, cy: 806, scale: 1, opacity: 0.34 },
  { cx: 232, cy: 810, scale: 0.94, opacity: 0.3 },
  { cx: 210, cy: 604, scale: 1.3, opacity: 0.26 },
];

const RIGHT_SILHOUETTES: Silhouette[] = [
  { cx: 1920 - 130, cy: 806, scale: 1, opacity: 0.34 },
  { cx: 1920 - 232, cy: 810, scale: 0.94, opacity: 0.3 },
  { cx: 1920 - 210, cy: 604, scale: 1.3, opacity: 0.26 },
];

const RADAR_PINGS = [
  { cx: 862, cy: 300, delay: '0s' },
  { cx: 1046, cy: 258, delay: '0.8s' },
  { cx: 918, cy: 432, delay: '1.6s' },
  { cx: 1078, cy: 402, delay: '2.4s' },
];

function MonitorGroup({ monitors, side }: { monitors: Monitor[]; side: 'left' | 'right' }) {
  return (
    <g>
      {monitors.map((m, i) => (
        <g key={`${side}-mon-${i}`} opacity={m.opacity}>
          <rect
            x={m.x - 14}
            y={m.y - 12}
            width={m.w + 28}
            height={m.h + 28}
            fill="#FFC94D"
            opacity={0.6}
            filter="url(#monitorGlow)"
          />
          <rect x={m.x} y={m.y} width={m.w} height={m.h} fill="#12100a" stroke="#F1C453" strokeOpacity={0.8} strokeWidth={1.5} />
          <rect x={m.x + 4} y={m.y + 4} width={m.w - 8} height={m.h - 8} fill="#D9A73B" opacity={0.4} />
          <rect x={m.x + m.w / 2 - 6} y={m.y + m.h / 2 - 4} width={12} height={8} fill="#FFE38A" opacity={0.7} />
        </g>
      ))}
    </g>
  );
}

function SilhouetteShape({ cx, cy, scale, opacity }: Silhouette) {
  const headR = 15 * scale;
  const shoulderW = 58 * scale;
  const shoulderH = 70 * scale;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy - headR * 2.6} r={headR} fill="#1a130a" stroke="#F1C453" strokeOpacity={0.45} strokeWidth={1.25} />
      <path
        d={`M${cx - shoulderW / 2},${cy} q${shoulderW / 2},${-shoulderH} ${shoulderW},0 z`}
        fill="#1a130a"
        stroke="#F1C453"
        strokeOpacity={0.35}
        strokeWidth={1.25}
      />
    </g>
  );
}

export function ControlRoomEnvironment() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mission-void" aria-hidden>
      <svg
        className="h-full w-full opacity-60 sm:opacity-85 lg:opacity-100"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="crBaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0f12" />
            <stop offset="45%" stopColor="#07080a" />
            <stop offset="100%" stopColor="#030405" />
          </linearGradient>
          <radialGradient id="crWarmFloor" cx="50%" cy="100%" r="75%">
            <stop offset="0%" stopColor="#7a5019" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7a5019" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crCenterGlow" cx="50%" cy="58%" r="46%">
            <stop offset="0%" stopColor="#FFD16E" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#FFD16E" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FFD16E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crPing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE38A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFE38A" stopOpacity="0" />
          </radialGradient>
          <filter id="monitorGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="hazeBlur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="55" />
          </filter>
          <clipPath id="crGlobeClip">
            <circle cx="960" cy="360" r="228" />
          </clipPath>
        </defs>

        {/* Base graphite room fill + warm floor bounce */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#crBaseGrad)" />
        <rect x="0" y="500" width="1920" height="580" fill="url(#crWarmFloor)" />

        {/* Warm haze band lighting the strip directly under the header */}
        <ellipse cx="960" cy="40" rx="960" ry="90" fill="#FFD16E" opacity="0.05" filter="url(#hazeBlur)" />

        {/* Atmospheric haze */}
        <ellipse cx="360" cy="220" rx="320" ry="170" fill="#FFE9B0" opacity="0.06" filter="url(#hazeBlur)" />
        <ellipse cx="1560" cy="220" rx="320" ry="170" fill="#FFE9B0" opacity="0.06" filter="url(#hazeBlur)" />

        {/* Distant screen wall / globe display, dead-center-back — mostly seen as
            warm light bleeding through the command screen's frosted glass. */}
        <g>
          <rect x="700" y="96" width="520" height="500" rx="6" fill="none" stroke="#E3B23C" strokeOpacity="0.16" />
          {[700, 700 + 520 - 26].map((x, i) => (
            <g key={`bezel-tl-${i}`}>
              <line x1={x} y1={96} x2={x + 26} y2={96} stroke="#E3B23C" strokeOpacity="0.42" />
              <line x1={i === 0 ? x : x + 26} y1={96} x2={i === 0 ? x : x + 26} y2={96 + 26} stroke="#E3B23C" strokeOpacity="0.42" />
            </g>
          ))}
          <circle cx="960" cy="360" r="290" fill="none" stroke="#E3B23C" strokeOpacity="0.06" />
          <circle cx="960" cy="360" r="258" fill="none" stroke="#E3B23C" strokeOpacity="0.1" />
          <circle cx="960" cy="360" r="228" fill="none" stroke="#E3B23C" strokeOpacity="0.2" />
          <g clipPath="url(#crGlobeClip)" opacity="0.5">
            {[180, 230, 280, 330, 380, 430, 480, 540].map((y) => (
              <line key={`lat-${y}`} x1="732" y1={y} x2="1188" y2={y} stroke="#E3B23C" strokeOpacity="0.07" />
            ))}
            {[760, 820, 880, 940, 1000, 1060, 1120, 1160].map((x) => (
              <line key={`lon-${x}`} x1={x} y1="132" x2={x} y2="588" stroke="#E3B23C" strokeOpacity="0.07" />
            ))}
          </g>
          <g className="animate-radar-spin" style={{ transformOrigin: '960px 360px' }} opacity="0.12">
            <path d="M960,360 L960,132 A228,228 0 0 1 1157,246 Z" fill="#E3B23C" />
          </g>
          {RADAR_PINGS.map((p, i) => (
            <circle
              key={`ping-${i}`}
              cx={p.cx}
              cy={p.cy}
              r="26"
              fill="url(#crPing)"
              className="animate-pulse-glow"
              style={{ animationDelay: p.delay }}
            />
          ))}
        </g>

        {/* Left / right console banks, hugging the extreme edges so they stay
            visible beside the command screen rather than behind it. */}
        <rect x="24" y="746" width="300" height="5" fill="#E3B23C" opacity="0.16" />
        <rect x={1920 - 324} y="746" width="300" height="5" fill="#E3B23C" opacity="0.16" />
        <MonitorGroup monitors={LEFT_MONITORS} side="left" />
        <MonitorGroup monitors={RIGHT_MONITORS} side="right" />

        {/* Analyst silhouettes */}
        {LEFT_SILHOUETTES.map((s, i) => (
          <SilhouetteShape key={`ls-${i}`} {...s} />
        ))}
        {RIGHT_SILHOUETTES.map((s, i) => (
          <SilhouetteShape key={`rs-${i}`} {...s} />
        ))}

        {/* Reflective floor strip */}
        <rect x="0" y="960" width="1920" height="120" fill="url(#crWarmFloor)" opacity="0.7" />
        <ellipse cx="180" cy="992" rx="150" ry="20" fill="#E3B23C" opacity="0.09" filter="url(#softBlur)" />
        <ellipse cx="1740" cy="992" rx="150" ry="20" fill="#E3B23C" opacity="0.09" filter="url(#softBlur)" />

        {/* Focal warm glow behind the central command screen */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#crCenterGlow)" />
      </svg>

      {/* Depth vignette — a wide ellipse that only pulls the very top/bottom
          into shadow; deliberately too wide to darken the left/right edges,
          which is where the workstation clusters need to stay legible. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(130% 62% at 50% 46%, rgba(3,4,5,0) 55%, rgba(3,4,5,0.45) 100%)',
        }}
      />
    </div>
  );
}
