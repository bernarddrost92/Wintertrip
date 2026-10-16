import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoldConfetti } from './GoldConfetti';

function mockMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('GoldConfetti', () => {
  afterEach(() => vi.useRealTimers());

  it('bursts gold pieces and reports done after ~2s so the parent can remove it', () => {
    vi.useFakeTimers();
    mockMotion(false);
    const onDone = vi.fn();
    render(<GoldConfetti onDone={onDone} />);
    expect(screen.getByTestId('gold-confetti').querySelectorAll('span').length).toBeGreaterThan(40);
    act(() => vi.advanceTimersByTime(1500));
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(800));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('with prefers-reduced-motion renders nothing and finishes straight away', () => {
    vi.useFakeTimers();
    mockMotion(true);
    const onDone = vi.fn();
    render(<GoldConfetti onDone={onDone} />);
    expect(screen.queryByTestId('gold-confetti')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
