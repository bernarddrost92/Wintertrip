import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HuntActivation } from './HuntActivation';

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

  it('with reduced motion shows nothing and still finishes', async () => {
    mockMotion(true);
    const onDone = vi.fn();
    render(<HuntActivation onDone={onDone} />);
    expect(screen.queryByTestId('hunt-activation')).not.toBeInTheDocument();
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
