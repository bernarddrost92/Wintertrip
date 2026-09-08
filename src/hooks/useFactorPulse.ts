import { useEffect, useRef, useState } from 'react';

/**
 * Returns a key that changes exactly once whenever `factor` changes (never
 * on first mount) — pair it with `key={pulseKey}` on an element carrying a
 * one-shot CSS animation to retrigger a brief "boosted" pulse each time the
 * Accountmanager picks a new rung on the Factor ladder, without pulsing on
 * every unrelated recalculation (dates, VCDB, ...).
 */
export function useFactorPulse(factor: number | undefined): number {
  const [pulseKey, setPulseKey] = useState(0);
  const prevFactor = useRef(factor);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current && factor !== undefined && factor !== prevFactor.current) {
      setPulseKey((k) => k + 1);
    }
    mounted.current = true;
    prevFactor.current = factor;
  }, [factor]);

  return pulseKey;
}
