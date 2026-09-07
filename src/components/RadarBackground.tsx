/** Purely decorative radar-grid backdrop. Original artwork, no third-party assets. */
export function RadarBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-radar-lines opacity-40" />
      <svg
        className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 animate-radar-spin opacity-[0.12]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="190" stroke="#E8B83E" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="140" stroke="#E8B83E" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="90" stroke="#E8B83E" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="40" stroke="#E8B83E" strokeWidth="0.5" />
        <line x1="200" y1="10" x2="200" y2="390" stroke="#E8B83E" strokeWidth="0.5" />
        <line x1="10" y1="200" x2="390" y2="200" stroke="#E8B83E" strokeWidth="0.5" />
        <path d="M200 200 L200 10 A190 190 0 0 1 334 87 Z" fill="#E8B83E" opacity="0.5" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-mission-void" />
    </div>
  );
}
