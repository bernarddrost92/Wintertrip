import { softAssetUrl } from './softAssets';

/**
 * Quiet coordinate-grid backdrop for a card — the supplied soft-grid asset,
 * static. (It used to draw its own spinning radar and scan lines; those
 * made the daily screens feel like a gamer cockpit.)
 */
export function TacticalGrid({ className = '', dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className={`absolute inset-0 ${dense ? 'opacity-100' : 'opacity-70'}`}
        style={{ backgroundImage: `url("${softAssetUrl('soft-grid')}")`, backgroundSize: '256px 256px' }}
      />
    </div>
  );
}

/** Small crosshair/target glyph used as a decorative marker next to labels. */
export function Crosshair({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
      <path d="M7 0v3.2M7 10.8V14M0 7h3.2M10.8 7H14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
