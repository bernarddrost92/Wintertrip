import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const AUDIO_SRC = '/audio/007-james-bond-theme.mp3';
const TARGET_VOLUME = 0.22;
const FADE_MS = 1400;
const STORAGE_ACTIVE = 'ws27-soundtrack-active';
const STORAGE_MUTED = 'ws27-soundtrack-muted';

function readStoredBool(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeStoredBool(key: string, value: boolean) {
  try {
    sessionStorage.setItem(key, value ? '1' : '0');
  } catch {
    // sessionStorage unavailable (private browsing etc.) — session memory only, not fatal.
  }
}

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
 * audio player. Never autoplays with sound: playback only starts from a
 * direct click, then fades in gently rather than snapping to volume. */
export function SoundtrackControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrame = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => readStoredBool(STORAGE_MUTED));

  // Restore an already-active session (e.g. after a same-tab reload). Browsers
  // block autoplay-with-sound without a fresh user gesture, so this attempt is
  // allowed to fail silently — the control simply stays OFF until clicked.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = TARGET_VOLUME;
    audio.muted = isMuted;
    if (readStoredBool(STORAGE_ACTIVE)) {
      audio.play().catch(() => {
        // Autoplay blocked — leave it off until the user clicks.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
    },
    [],
  );

  function fadeVolumeTo(target: number, onDone?: () => void) {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
    const start = audio.volume;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / FADE_MS);
      audio.volume = start + (target - start) * t;
      if (t < 1) {
        fadeFrame.current = requestAnimationFrame(step);
      } else {
        fadeFrame.current = null;
        onDone?.();
      }
    };
    fadeFrame.current = requestAnimationFrame(step);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = 0;
      audio
        .play()
        .then(() => fadeVolumeTo(TARGET_VOLUME))
        .catch(() => {
          // Playback blocked or failed — never let this affect the rest of the app.
        });
    } else {
      fadeVolumeTo(0, () => audio.pause());
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    audio.muted = next;
    setIsMuted(next);
    writeStoredBool(STORAGE_MUTED, next);
  }

  return (
    <div className="flex items-center gap-2 border-l border-gold/10 pl-3">
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        loop
        preload="none"
        className="hidden"
        onPlay={() => {
          setIsPlaying(true);
          writeStoredBool(STORAGE_ACTIVE, true);
        }}
        onPause={() => {
          setIsPlaying(false);
          writeStoredBool(STORAGE_ACTIVE, false);
        }}
      />
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
