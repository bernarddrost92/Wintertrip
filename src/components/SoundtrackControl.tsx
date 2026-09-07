import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useSoundtrack } from '../features/soundtrack/soundtrackContext';

/** Five gold bars that bounce while the soundtrack is actually audible, and
 * sit flat the moment it is paused or muted — a control-room meter, not a
 * decorative loop that runs regardless of what's really playing. */
function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full bg-gold ${active ? 'animate-eq' : ''}`}
          style={active ? { animationDelay: `${i * 0.11}s`, animationDuration: `${0.75 + i * 0.13}s` } : { height: '3px' }}
        />
      ))}
    </span>
  );
}

/** A premium, control-room-styled soundtrack toggle — not a native HTML
 * audio player. The audio element itself lives in SoundtrackProvider (so the
 * mission gate's ACCEPT MISSION button can start the exact same track); this
 * component is purely the header UI for it. */
export function SoundtrackControl() {
  const { isPlaying, isMuted, togglePlay, toggleMute } = useSoundtrack();

  return (
    <div className="flex items-center gap-2 border-l border-gold/10 pl-3">
      <button
        type="button"
        onClick={togglePlay}
        aria-pressed={isPlaying}
        title={isPlaying ? 'Pauzeer soundtrack' : 'Speel soundtrack af'}
        className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/25 bg-mission-raised text-gold/80 transition-colors duration-150 hover:border-gold/50 hover:text-gold"
      >
        {isPlaying ? <Pause size={11} aria-hidden /> : <Play size={11} aria-hidden />}
      </button>

      <div className="hidden items-center gap-2 sm:flex">
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={isMuted}
          title={isMuted ? 'Zet geluid aan' : 'Dempen'}
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/25 bg-mission-raised text-gold/80 transition-colors duration-150 hover:border-gold/50 hover:text-gold"
        >
          {isMuted ? <VolumeX size={11} aria-hidden /> : <Volume2 size={11} aria-hidden />}
        </button>
        <Equalizer active={isPlaying && !isMuted} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Soundtrack <span className="text-gold/40">//</span>{' '}
          <span className={isPlaying ? 'text-gold' : 'text-ink-dim'}>{isPlaying ? 'Active' : 'Off'}</span>
        </span>
      </div>
    </div>
  );
}
