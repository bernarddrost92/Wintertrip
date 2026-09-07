import { ShieldCheck, Target } from 'lucide-react';
import { useSoundtrack } from '../soundtrack/soundtrackContext';

interface MissionGateProps {
  onAccept: () => void;
}

/**
 * The single, deliberate click that both browser autoplay policy and the
 * cinematic pacing need: starting the soundtrack and starting the intro
 * animation both happen inside this one synchronous click handler, so
 * audio.play() runs on a genuine user gesture.
 */
export function MissionGate({ onAccept }: MissionGateProps) {
  const { start } = useSoundtrack();

  function handleAccept() {
    start();
    onAccept();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mission-void/70 px-4 animate-[intro-quickfade_0.5s_ease-out_both]">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 border border-gold/25 bg-mission-void/80 px-8 py-12 text-center shadow-gold-lg backdrop-blur-sm">
        <span className="flex h-14 w-14 items-center justify-center border border-gold/50 text-gold" aria-hidden>
          <Target size={26} />
        </span>

        <div className="space-y-1.5">
          <p className="font-display text-2xl font-bold tracking-[0.14em] text-ink">007</p>
          <p className="font-display text-xl font-bold uppercase leading-tight tracking-[0.08em] text-gold-gradient bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent">
            Operatie Wintersport 2027
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold/80">Team Zwolle</p>
        </div>

        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          <ShieldCheck size={13} className="text-gold/70" aria-hidden />
          Classified Access
        </p>

        <button
          type="button"
          onClick={handleAccept}
          className="mt-2 w-full border border-gold bg-gold/10 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.24em] text-gold shadow-gold transition-colors duration-150 hover:bg-gold/20"
        >
          Accept Mission
        </button>
        <p className="text-[10px] text-ink-dim">Bevat een optionele soundtrack — schakel geluid op elk moment in of uit.</p>
      </div>
    </div>
  );
}
