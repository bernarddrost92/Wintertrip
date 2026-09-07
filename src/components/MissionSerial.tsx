import { Crosshair } from './TacticalGrid';

/** Decorative classification strip — mission ID / clearance / league window. */
export function MissionSerial() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
      <span className="flex items-center gap-1.5">
        <Crosshair className="text-gold/60" />
        MISSION ID <span className="text-gold/80">OJ-2609-ZWL</span>
      </span>
      <span className="hidden text-gold/20 sm:inline">|</span>
      <span className="hidden sm:inline">
        CLEARANCE <span className="text-gold/80">GOLD</span>
      </span>
      <span className="hidden text-gold/20 md:inline">|</span>
      <span className="hidden md:inline">
        LEAGUE WINDOW <span className="text-gold/80">153 DAYS</span>
      </span>
    </div>
  );
}

/** Tiny status LED — used sparingly to signal live/ready/success states. */
export function StatusLed({ tone = 'gold', pulse = true }: { tone?: 'gold' | 'go' | 'muted'; pulse?: boolean }) {
  const color = tone === 'go' ? 'bg-status-go' : tone === 'muted' ? 'bg-ink-dim' : 'bg-gold';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color} ${pulse ? 'animate-led-blink' : ''}`} aria-hidden />;
}
