/**
 * When each part of the Hunt Room enters (ms, used as CSS animation-delay).
 * After a deliberate activation they follow the MISSION ACTIVATED sequence
 * in HuntActivation, so switch → stamp → room reads as one transition; on
 * a plain open (restore after reload) it is a short, quiet stagger. With
 * reduced motion callers skip the delays altogether.
 */
export interface HuntEntryDelays {
  room: number;
  kicker: number;
  title: number;
  strip: number;
  actions: number;
  moves: number;
}

const AFTER_ACTIVATION: HuntEntryDelays = { room: 1450, kicker: 1650, title: 1750, strip: 1950, actions: 2150, moves: 2300 };
const PLAIN: HuntEntryDelays = { room: 0, kicker: 0, title: 80, strip: 200, actions: 320, moves: 420 };
const NONE: HuntEntryDelays = { room: 0, kicker: 0, title: 0, strip: 0, actions: 0, moves: 0 };

export function huntEntryDelays(fromActivation: boolean, reduced: boolean): HuntEntryDelays {
  if (reduced) return NONE;
  return fromActivation ? AFTER_ACTIVATION : PLAIN;
}

/** Reveal: how long the old line takes to leave before the new one locks in. */
export const REVEAL_SWAP_MS = 170;
