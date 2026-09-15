import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { grantAccess, hasAccess } from './features/access/accessStorage';

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

describe('App — access gate', () => {
  it('A. is shown when no access has been granted on this device — no app content renders', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
    // F. Route-level content — the mission gate, the homepage briefing —
    // never renders while access is ungranted, root-level protection.
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
  });

  it('G. after entering the correct code, the existing intro flow runs exactly as before', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/enter access code/i), 'Zwolle{Enter}');

    // Access Gate is gone; the pre-existing Mission Gate ("Accept Mission") takes over.
    expect(screen.queryByRole('button', { name: /authorize/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accept Mission' }));
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('D. once access is granted it is skipped on a fresh mount ("reload")', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText(/enter access code/i), 'Zwolle{Enter}');
    expect(hasAccess()).toBe(true);
    unmount();

    render(<App />);
    expect(screen.queryByRole('button', { name: /authorize/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument();
  });
});

describe('App — mission gate / intro / home flow (access already granted)', () => {
  beforeEach(() => {
    grantAccess();
  });

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

  it('E. RESET ACCESS clears stored access and brings the Access Gate back', async () => {
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Missie #1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reset Access/i }));

    expect(hasAccess()).toBe(false);
    expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
  });
});

describe('App — /mission-updates direct route (via the 404.html redirect param)', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('a direct /mission-updates link never shows app content while access is ungranted', () => {
    window.history.pushState({}, '', '/?redirect=mission-updates');
    render(<App />);

    expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
    expect(screen.queryByText(/mission archive/i)).not.toBeInTheDocument();
  });

  it('once access + the intro are already clear, the direct link lands straight on Mission Updates', () => {
    grantAccess();
    sessionStorage.setItem('ws27-intro-seen', '1');
    window.history.pushState({}, '', '/?redirect=mission-updates');

    render(<App />);

    expect(screen.getByText(/007 · mission archive/i)).toBeInTheDocument();
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
  });

  it('cleans the redirect param out of the visible URL after restoring the view', () => {
    grantAccess();
    sessionStorage.setItem('ws27-intro-seen', '1');
    window.history.pushState({}, '', '/?redirect=mission-updates');

    render(<App />);

    expect(window.location.search).toBe('');
  });
});

describe('App — Mission Hunt: a failed lazy chunk load never black-screens the app', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    grantAccess();
    sessionStorage.setItem('ws27-intro-seen', '1');
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.doUnmock('./features/mission-hunt/MissionHuntPage');
  });

  it('a rejected dynamic import (e.g. a stale chunk reference after a redeploy) shows System Error, not an empty page — and the rest of the app stays usable', async () => {
    // Simulates exactly the reproduced bug: React.lazy's import() rejecting.
    // Without an error boundary this unmounts #root entirely (confirmed by
    // direct reproduction before this fix) — with one, only Mission Hunt's
    // subtree is affected.
    vi.doMock('./features/mission-hunt/MissionHuntPage', () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    console.error = vi.fn();

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Missie #1')).toBeInTheDocument();
    await user.click(screen.getByText(/open mission/i));

    await waitFor(() => expect(screen.getByText('System Error')).toBeInTheDocument());

    // The app shell around Mission Hunt is still there — this is not a
    // blank/unmounted page.
    expect(screen.getByRole('button', { name: 'Mission Hunt' })).toBeInTheDocument();
    expect(document.body.textContent).not.toBe('');

    // BACK TO HOME actually navigates — the rest of the app still works.
    await user.click(screen.getByRole('button', { name: /back to home/i }));
    expect(screen.getByText('Missie #1')).toBeInTheDocument();
  });
});
