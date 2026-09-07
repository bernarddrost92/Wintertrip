import { useEffect, useRef, useState, type ReactNode } from 'react';
import { withBase } from '../../utils/assetPath';
import { SoundtrackContext } from './soundtrackContext';

const AUDIO_SRC = withBase('audio/007-james-bond-theme.mp3');
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

/**
 * Owns the single, session-wide <audio> element so playback started from a
 * user gesture in one part of the UI (the mission gate) is the exact same
 * element controlled from another (the header toggle) — there is only ever
 * one soundtrack instance, never a duplicate that autoplays separately.
 */
export function SoundtrackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrame = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => readStoredBool(STORAGE_MUTED));

  // Restore an already-active session (e.g. after a same-tab reload). Browsers
  // block autoplay-with-sound without a fresh user gesture, so this attempt is
  // allowed to fail silently — playback simply stays off until clicked.
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

  function start() {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => fadeVolumeTo(TARGET_VOLUME))
      .catch(() => {
        // Playback blocked or failed — never let this affect the rest of the app.
      });
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      start();
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
    <SoundtrackContext.Provider value={{ isPlaying, isMuted, start, togglePlay, toggleMute }}>
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
      {children}
    </SoundtrackContext.Provider>
  );
}
