export type PodiumState = 'gold' | 'silver' | 'bronze' | 'default' | 'awaiting';

/** Maps a virtual League position to the Virtual Position card's visual state. Never fabricates a position: null stays 'awaiting'. */
export function getPodiumState(virtualPosition: number | null): PodiumState {
  if (virtualPosition === null) return 'awaiting';
  if (virtualPosition === 1) return 'gold';
  if (virtualPosition === 2) return 'silver';
  if (virtualPosition === 3) return 'bronze';
  return 'default';
}

/** How far the leader's score is ahead of another team's — never hardcoded, always derived from the current Top 3 snapshot. */
export function calculateScoreLead(leaderScore: number | null, otherScore: number | null): number | null {
  if (leaderScore === null || otherScore === null) return null;
  return Math.round((leaderScore - otherScore) * 100) / 100;
}
