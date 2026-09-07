import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAutoScrollOnReady } from './useAutoScrollOnReady';
import type { MissionReadiness } from '../features/calculator/useMissionControlCalculator';

function mockViewport({ mobile }: { mobile: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width: 767px') ? mobile : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderTarget() {
  const el = document.createElement('div');
  el.scrollIntoView = vi.fn();
  return el;
}

describe('useAutoScrollOnReady (mobile-only, fires once per READY transition)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls on mobile the moment readiness becomes READY', () => {
    mockViewport({ mobile: true });
    const target = renderTarget();
    const ref = { current: target };

    const { rerender } = renderHook(({ readiness }: { readiness: MissionReadiness }) => useAutoScrollOnReady(ref, readiness), {
      initialProps: { readiness: 'INPUT_REQUIRED' as MissionReadiness },
    });
    expect(target.scrollIntoView).not.toHaveBeenCalled();

    rerender({ readiness: 'READY' });
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(target.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth', block: 'start' }));
  });

  it('does not scroll again while readiness stays READY (e.g. changing the Factor)', () => {
    mockViewport({ mobile: true });
    const target = renderTarget();
    const ref = { current: target };

    const { rerender } = renderHook(({ readiness }: { readiness: MissionReadiness }) => useAutoScrollOnReady(ref, readiness), {
      initialProps: { readiness: 'READY' as MissionReadiness },
    });

    // READY on mount is not a transition into READY (there's no "before" state
    // that wasn't READY), so nothing should have scrolled yet.
    expect(target.scrollIntoView).not.toHaveBeenCalled();

    rerender({ readiness: 'READY' });
    rerender({ readiness: 'READY' });
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it('never scrolls on desktop, even when readiness becomes READY', () => {
    mockViewport({ mobile: false });
    const target = renderTarget();
    const ref = { current: target };

    const { rerender } = renderHook(({ readiness }: { readiness: MissionReadiness }) => useAutoScrollOnReady(ref, readiness), {
      initialProps: { readiness: 'INPUT_REQUIRED' as MissionReadiness },
    });

    rerender({ readiness: 'READY' });
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls again on a genuine new transition (READY -> INVALID -> READY)', () => {
    mockViewport({ mobile: true });
    const target = renderTarget();
    const ref = { current: target };

    const { rerender } = renderHook(({ readiness }: { readiness: MissionReadiness }) => useAutoScrollOnReady(ref, readiness), {
      initialProps: { readiness: 'READY' as MissionReadiness },
    });

    rerender({ readiness: 'INVALID' });
    rerender({ readiness: 'READY' });
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
