import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ACTIVATION_CONFETTI_MS, HuntActivation } from './HuntActivation';

function mockMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('HuntActivation', () => {
  it('shows the MISSION ACTIVATED target lock over the gold burst', () => {
    mockMotion(false);
    render(<HuntActivation onDone={vi.fn()} />);
    expect(screen.getByTestId('hunt-activation')).toHaveTextContent(/target locked/i);
    expect(screen.getByTestId('hunt-activation')).toHaveTextContent(/mission activated/i);
    expect(screen.getByTestId('gold-confetti')).toBeInTheDocument();
  });

  it('is one CSS timeline: dim → TARGET LOCKED → MISSION ACTIVATED, confetti from 0.9s, done after the burst', () => {
    vi.useFakeTimers();
    try {
      mockMotion(false);
      const onDone = vi.fn();
      render(<HuntActivation onDone={onDone} />);
      const layer = screen.getByTestId('hunt-activation');
      expect(layer.querySelector('.hunt3-act-dim')).not.toBeNull();
      expect(layer.querySelector('.hunt3-act-lock')).toHaveTextContent(/target locked/i);
      expect(layer.querySelector('.hunt3-act-activated')).toHaveTextContent(/mission activated/i);
      const flash = screen.getByTestId('gold-confetti').firstElementChild as HTMLElement;
      expect(flash.style.animationDelay).toBe(`${ACTIVATION_CONFETTI_MS}ms`);
      act(() => vi.advanceTimersByTime(ACTIVATION_CONFETTI_MS + 2000));
      expect(onDone).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(200));
      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('with reduced motion shows nothing and still finishes', async () => {
    mockMotion(true);
    const onDone = vi.fn();
    render(<HuntActivation onDone={onDone} />);
    expect(screen.queryByTestId('hunt-activation')).not.toBeInTheDocument();
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
