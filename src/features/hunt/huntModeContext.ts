import { createContext, useContext } from 'react';

export interface HuntModeContextValue {
  /** true = HUNT MODE, false = QUIET MODE (the default). */
  active: boolean;
  /** Bumps on every deliberate activation — keys the confetti burst and the
   * mission intro, so a restore after a same-tab reload shows neither. */
  activationId: number;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}

const INACTIVE: HuntModeContextValue = { active: false, activationId: 0, enter: () => {}, exit: () => {}, toggle: () => {} };

export const HuntModeContext = createContext<HuntModeContextValue>(INACTIVE);

/** Outside a HuntModeProvider this reads as QUIET MODE with no-op actions. */
export function useHuntMode(): HuntModeContextValue {
  return useContext(HuntModeContext);
}
