import { softAssetUrl } from './softAssets';

const GRID_MASK = 'linear-gradient(to bottom, transparent 0%, black 22%, black 75%, transparent 100%)';

/**
 * The quiet backdrop for the daily screens — a premium briefing room, not a
 * cockpit: matte charcoal, one soft radar top right, one arc bottom left, an
 * almost invisible grid and a soft vignette. Static: no spin, no pings, no
 * silhouettes. Every line is a supplied asset (see softAssets.ts); the
 * cinematic ControlRoomEnvironment stays for the gate and intro. Decoration
 * is weaker on mobile, where it would otherwise sit behind text.
 */
export function Soft007Environment() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mission-void" aria-hidden data-environment="soft-007">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 8%, rgba(214,174,85,.06), transparent 65%), linear-gradient(180deg,#1B2027 0%,#171B21 48%,#14181E 100%)',
        }}
      />
      <img
        src={softAssetUrl('soft-radar-corner')}
        alt=""
        className="absolute -right-40 -top-40 w-[520px] opacity-[0.08] sm:-right-28 sm:-top-32 sm:w-[760px] sm:opacity-[0.12] lg:w-[900px] lg:opacity-[0.14]"
      />
      <img
        src={softAssetUrl('soft-arc-bottom-left')}
        alt=""
        className="absolute -bottom-16 -left-40 w-[620px] opacity-[0.06] sm:-left-28 sm:w-[760px] sm:opacity-[0.1] lg:w-[980px]"
      />
      <div
        className="absolute inset-0 opacity-[0.5] sm:opacity-[0.8]"
        style={{
          backgroundImage: `url("${softAssetUrl('soft-grid')}")`,
          backgroundSize: '512px 512px',
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(110% 82% at 50% 44%, transparent 48%, rgba(4,6,8,.3) 100%)' }} />
    </div>
  );
}
