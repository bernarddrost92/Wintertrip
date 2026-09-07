import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { MissionReadiness } from '../features/calculator/useMissionControlCalculator';

const MOBILE_QUERY = '(max-width: 767px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Scrolls the given element into view exactly once — the moment readiness
 * transitions into READY from anything else. Never fires again while it
 * stays READY (e.g. picking a different Factor doesn't re-trigger it), and
 * never fires above the mobile/tablet-small breakpoint — desktop never
 * auto-scrolls.
 */
export function useAutoScrollOnReady(targetRef: RefObject<HTMLElement | null>, readiness: MissionReadiness) {
  const previousReadiness = useRef<MissionReadiness>(readiness);

  useEffect(() => {
    const becameReady = previousReadiness.current !== 'READY' && readiness === 'READY';
    previousReadiness.current = readiness;

    if (!becameReady) return;
    if (typeof window === 'undefined' || !window.matchMedia(MOBILE_QUERY).matches) return;

    const target = targetRef.current;
    if (!target) return;

    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [readiness, targetRef]);
}
