/** Purely decorative radar/coordinate-grid backdrop. Original artwork, no third-party assets. */
export function TacticalGrid({ className = '', dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className={`tactical-grid-bg ${dense ? 'opacity-100' : 'opacity-60'}`} />
      <svg
        className="absolute left-1/2 top-1/2 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 animate-radar-spin opacity-[0.08]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="190" stroke="#E3B23C" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="140" stroke="#E3B23C" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="90" stroke="#E3B23C" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="40" stroke="#E3B23C" strokeWidth="0.5" />
        <line x1="200" y1="10" x2="200" y2="390" stroke="#E3B23C" strokeWidth="0.5" />
        <line x1="10" y1="200" x2="390" y2="200" stroke="#E3B23C" strokeWidth="0.5" />
        <path d="M200 200 L200 10 A190 190 0 0 1 334 87 Z" fill="#E3B23C" opacity="0.5" />
      </svg>
      <div className="scan-overlay" />
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
