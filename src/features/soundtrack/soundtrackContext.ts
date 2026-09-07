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
}

export const SoundtrackContext = createContext<SoundtrackContextValue | null>(null);

export function useSoundtrack(): SoundtrackContextValue {
  const ctx = useContext(SoundtrackContext);
  if (!ctx) throw new Error('useSoundtrack must be used within a SoundtrackProvider');
  return ctx;
}
