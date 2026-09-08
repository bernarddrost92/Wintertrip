export type FteGapOutcome =
  | { kind: 'awaiting-target' }
  | { kind: 'awaiting-projection' }
  | { kind: 'gap'; amount: number }
  | { kind: 'secured'; buffer: number };

/**
 * Net FTE gap toward the 31 Jan measurement date — never a fabricated
 * number when an input is missing. A null target always reads as
 * 'awaiting-target' regardless of projected; a known target with no
 * projection yet reads as 'awaiting-projection' rather than assuming 0.
 */
export function calculateFteGap(targetFteOnJan31: number | null, projectedFteOnJan31: number | null): FteGapOutcome {
  if (targetFteOnJan31 === null) return { kind: 'awaiting-target' };
  if (projectedFteOnJan31 === null) return { kind: 'awaiting-projection' };
  const gap = Math.round((targetFteOnJan31 - projectedFteOnJan31) * 100) / 100;
  if (gap > 0) return { kind: 'gap', amount: gap };
  const buffer = Math.round((projectedFteOnJan31 - targetFteOnJan31) * 100) / 100;
  return { kind: 'secured', buffer };
}

export interface FteProgress {
  /** Clamped 0-100 for the visual bar. */
  percent: number;
  /** How far projected exceeds target, 0 when at or below target. */
  overTarget: number;
}

/** null when either figure or the target itself (<=0) can't support a real percentage — never a guessed bar fill. */
export function calculateFteProgress(projectedFteOnJan31: number | null, targetFteOnJan31: number | null): FteProgress | null {
  if (projectedFteOnJan31 === null || targetFteOnJan31 === null || targetFteOnJan31 <= 0) return null;
  const raw = (projectedFteOnJan31 / targetFteOnJan31) * 100;
  const percent = Math.min(100, Math.max(0, raw));
  const overTarget = projectedFteOnJan31 > targetFteOnJan31 ? Math.round((projectedFteOnJan31 - targetFteOnJan31) * 100) / 100 : 0;
  return { percent, overTarget };
}
