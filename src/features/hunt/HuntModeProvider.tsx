import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSoundtrack } from '../soundtrack/soundtrackContext';
import { HuntModeContext } from './huntModeContext';

export const HUNT_MODE_STORAGE_KEY = 'ws27-hunt-mode';

function readStored(): boolean {
  try {
    return sessionStorage.getItem(HUNT_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStored(active: boolean) {
  try {
    sessionStorage.setItem(HUNT_MODE_STORAGE_KEY, active ? '1' : '0');
  } catch {
    // sessionStorage unavailable — the mode simply isn't remembered.
  }
}

/**
 * QUIET MODE ↔ HUNT MODE. Quiet is the default; the choice is remembered in
 * sessionStorage only, so a new browser session always starts Quiet. A
 * deliberate switch to Hunt is a user gesture, so it also starts the
 * existing soundtrack (no-op if it is already playing; mute is respected —
 * the existing controls keep working exactly as before).
 */
export function HuntModeProvider({ children }: { children: ReactNode }) {
  const soundtrack = useSoundtrack();
  const [active, setActive] = useState(readStored);
  const [activationId, setActivationId] = useState(0);

  const enter = useCallback(() => {
    setActive(true);
    setActivationId((id) => id + 1);
    writeStored(true);
    soundtrack.start();
  }, [soundtrack]);

  const exit = useCallback(() => {
    setActive(false);
    writeStored(false);
  }, []);

  const value = useMemo(
    () => ({ active, activationId, enter, exit, toggle: () => (active ? exit() : enter()) }),
    [active, activationId, enter, exit],
  );

  return <HuntModeContext.Provider value={value}>{children}</HuntModeContext.Provider>;
}
