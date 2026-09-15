import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissionHuntErrorBoundary } from './MissionHuntErrorBoundary';

function Bomb(): never {
  throw new Error('boom');
}

// A thrown error in a render prints a scary "Uncaught" line to stderr even
// when a boundary catches it fine — expected React noise, not a test failure.
const originalConsoleError = console.error;

describe('MissionHuntErrorBoundary — unexpected Mission Hunt runtime error is caught', () => {
  it('never lets a thrown render error unmount past it — shows SYSTEM ERROR instead', () => {
    console.error = vi.fn();
    try {
      render(
        <MissionHuntErrorBoundary onRetry={vi.fn()} onBackHome={vi.fn()}>
          <Bomb />
        </MissionHuntErrorBoundary>,
      );
    } finally {
      console.error = originalConsoleError;
    }

    expect(screen.getByText('System Error')).toBeInTheDocument();
    expect(screen.getByText(/mission intelligence kon niet worden geladen/i)).toBeInTheDocument();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <MissionHuntErrorBoundary onRetry={vi.fn()} onBackHome={vi.fn()}>
        <p>All good</p>
      </MissionHuntErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByText('System Error')).not.toBeInTheDocument();
  });

  it('RETRY calls onRetry — a real navigation (App.tsx), since an in-place retry cannot reliably re-fetch an already-failed chunk URL', async () => {
    console.error = vi.fn();
    const onRetry = vi.fn();
    const user = userEvent.setup();
    try {
      render(
        <MissionHuntErrorBoundary onRetry={onRetry} onBackHome={vi.fn()}>
          <Bomb />
        </MissionHuntErrorBoundary>,
      );
    } finally {
      console.error = originalConsoleError;
    }

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('BACK TO HOME calls onBackHome', async () => {
    console.error = vi.fn();
    const onBackHome = vi.fn();
    const user = userEvent.setup();
    try {
      render(
        <MissionHuntErrorBoundary onRetry={vi.fn()} onBackHome={onBackHome}>
          <Bomb />
        </MissionHuntErrorBoundary>,
      );
    } finally {
      console.error = originalConsoleError;
    }

    await user.click(screen.getByRole('button', { name: /back to home/i }));
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });

  it('never logs the raw error or a stack trace to the user-facing UI', () => {
    console.error = vi.fn();
    try {
      render(
        <MissionHuntErrorBoundary onRetry={vi.fn()} onBackHome={vi.fn()}>
          <Bomb />
        </MissionHuntErrorBoundary>,
      );
    } finally {
      console.error = originalConsoleError;
    }

    expect(screen.queryByText(/boom/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
  });
});
