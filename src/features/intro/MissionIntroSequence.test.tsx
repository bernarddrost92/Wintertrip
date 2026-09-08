import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionIntroSequence } from './MissionIntroSequence';

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe('MissionIntroSequence', () => {
  it('calls onComplete on its own after the full sequence, without a click', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<MissionIntroSequence onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3600);
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('SKIP INTRO calls onComplete immediately, without waiting for the full sequence', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<MissionIntroSequence onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: /skip intro/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('never calls onComplete twice when skipped just before the timer would have fired', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<MissionIntroSequence onComplete={onComplete} />);

    vi.advanceTimersByTime(3600);
    vi.advanceTimersByTime(3600);
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
