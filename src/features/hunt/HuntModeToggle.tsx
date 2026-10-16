import { Crosshair } from 'lucide-react';
import { useHuntMode } from './huntModeContext';

/**
 * QUIET ◉ HUNT — the switch between the daily work mode and the
 * salesmeeting mode. Wide screens show QUIET [track] HUNT, laptops
 * [track] HUNT, mobile compacts to a target icon + HUNT. Gold only when Hunt is on.
 */
export function HuntModeToggle() {
  const { active, toggle } = useHuntMode();

  return (
    <div className="flex items-center border-l border-white/[0.07] pl-2 sm:pl-3">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Hunt Mode"
        title={active ? 'Terug naar Quiet Mode' : 'Start Hunt Mode'}
        onClick={toggle}
        className={`group inline-flex items-center gap-2 px-1.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-200 ${
          active ? 'text-gold' : 'text-ink-muted hover:text-ink'
        }`}
      >
        <span className={`hidden 2xl:inline ${active ? 'text-ink-dim' : 'text-ink'}`}>Quiet</span>
        <span
          className={`relative hidden h-4 w-8 shrink-0 border transition-colors duration-200 md:inline-block ${
            active ? 'border-gold bg-gold/25' : 'border-white/20 bg-mission-panel'
          }`}
          aria-hidden
        >
          <span
            className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 transition-transform duration-200 ${
              active ? 'translate-x-[17px] bg-gold' : 'translate-x-[2px] bg-ink-dim'
            }`}
          />
        </span>
        <Crosshair size={14} className={`md:hidden ${active ? 'text-gold' : ''}`} aria-hidden />
        <span>Hunt</span>
      </button>
    </div>
  );
}
