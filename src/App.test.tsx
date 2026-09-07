import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// Force the reduced-motion path everywhere in these tests: the intro then
// resolves in ~700ms instead of ~3.5s, which is what actually matters for a
// gating test (the state machine, not the animation timing itself).
function mockReducedMotion() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('App — mission gate / intro / home flow', () => {
  it('shows the mission gate on a first visit, then the briefing after ACCEPT MISSION and the intro', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument();
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accept Mission' }));

    // Intro is playing (reduced-motion, short path) — the gate is gone already.
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('skips the gate on a session that already saw the intro', () => {
    sessionStorage.setItem('ws27-intro-seen', '1');
    render(<App />);

    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();
    expect(screen.getByText('Missie #1')).toBeInTheDocument();
  });

  it('REPLAY INTRO brings the intro back without needing ACCEPT MISSION again', async () => {
    mockReducedMotion();
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Missie #1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Replay Intro/i }));

    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });
});
