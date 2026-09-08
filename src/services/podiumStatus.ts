export type PodiumState = 'gold' | 'silver' | 'bronze' | 'default' | 'awaiting';

/** Maps a virtual League position to the Virtual Position card's visual state. Never fabricates a position: null stays 'awaiting'. */
export function getPodiumState(virtualPosition: number | null): PodiumState {
  if (virtualPosition === null) return 'awaiting';
  if (virtualPosition === 1) return 'gold';
  if (virtualPosition === 2) return 'silver';
  if (virtualPosition === 3) return 'bronze';
  return 'default';
}
