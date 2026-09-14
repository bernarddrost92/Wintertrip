import { createContext, useContext } from 'react';

export interface SoundtrackContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  /** Starts playback with a fade-in. No-op if already playing — safe to
   * call from the mission-gate's ACCEPT MISSION click without also having
   * to check state first. */
  start: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  /** Fades out and pauses, unconditionally — never toggles back on if
   * already paused. Used only for necessary audio coordination (e.g. a
   * Mission Update video must never play at the same time as the app
   * soundtrack), never as a second way to express togglePlay's intent. */
  pause: () => void;
}

export const SoundtrackContext = createContext<SoundtrackContextValue | null>(null);

export function useSoundtrack(): SoundtrackContextValue {
  const ctx = useContext(SoundtrackContext);
  if (!ctx) throw new Error('useSoundtrack must be used within a SoundtrackProvider');
  return ctx;
}
