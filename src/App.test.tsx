import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('./lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

const CORRECT_PASSWORD = 'the-real-shared-team-zwolle-password';

/** A minimal fake of the subset of supabase-js's `auth` this app actually
 * calls — enough to drive the real Access Gate through a real render
 * without a live Supabase project. Mirrors real behavior closely enough for
 * this test's purposes: signInWithPassword/signOut both update the same
 * underlying session and notify onAuthStateChange listeners, exactly like
 * the real client does. */
function createFakeAuth(initialSession: { access_token: string } | null = null) {
  let session = initialSession;
  const listeners: Array<(event: string, session: unknown) => void> = [];

  function setSession(next: { access_token: string } | null) {
    session = next;
    listeners.forEach((cb) => cb(next ? 'SIGNED_IN' : 'SIGNED_OUT', next));
  }

  return {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe: () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      } } } };
    },
    signInWithPassword: vi.fn(async ({ password }: { email: string; password: string }) => {
      if (password === CORRECT_PASSWORD) {
        setSession({ access_token: 'tech-account-token' });
        return { data: { session }, error: null };
      }
      return { data: { session: null }, error: { message: 'Invalid login credentials' } };
    }),
    signOut: vi.fn(async () => {
      setSession(null);
      return { error: null };
    }),
  };
}

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

beforeEach(() => {
  isSupabaseConfigured.mockReturnValue(true);
});

describe('App — access gate (real Supabase Auth, shared Team Zwolle password)', () => {
  it('A. is shown with no Supabase session — no app content renders', async () => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth(null) });
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
    // The technical account email is a non-secret identifier but must still
    // never appear in the UI.
    expect(document.body.textContent).not.toMatch(/teamzwolle@wintertrip\.internal/i);
  });

  it('shows a SETUP REQUIRED notice, never the password screen, when Supabase is not configured', () => {
    isSupabaseConfigured.mockReturnValue(false);
    render(<App />);

    expect(screen.getByText(/setup required/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/wachtwoord/i)).not.toBeInTheDocument();
  });

  it('G. after entering the correct shared password, the existing intro flow runs exactly as before', async () => {
    mockReducedMotion();
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth(null) });
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument());
    await user.type(screen.getByLabelText(/wachtwoord/i), `${CORRECT_PASSWORD}{Enter}`);

    // Access Gate is gone; the pre-existing Mission Gate ("Accept Mission") takes over.
    await waitFor(() => expect(screen.queryByLabelText(/wachtwoord/i)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accept Mission' }));
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('6. a wrong password never opens the app', async () => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth(null) });
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument());
    await user.type(screen.getByLabelText(/wachtwoord/i), 'wrong-password{Enter}');

    expect(await screen.findByText(/toegang geweigerd/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();
  });

  it('D/10/11. a session that already exists at mount (persisted / reopened browser) skips the password screen entirely', async () => {
    mockReducedMotion();
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'already-signed-in' }) });
    render(<App />);

    await waitFor(() => expect(screen.queryByLabelText(/wachtwoord/i)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument();
  });
});

describe('App — mission gate / intro / home flow (a Team Zwolle session already exists)', () => {
  let auth: ReturnType<typeof createFakeAuth>;

  beforeEach(() => {
    auth = createFakeAuth({ access_token: 'existing-session' });
    getSupabaseClient.mockReturnValue({ auth });
  });

  it('shows the mission gate on a first visit, then the briefing after ACCEPT MISSION and the intro', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Accept Mission' })).toBeInTheDocument());
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accept Mission' }));
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('skips the gate on a session that already saw the intro', async () => {
    sessionStorage.setItem('ws27-intro-seen', '1');
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Accept Mission' })).not.toBeInTheDocument();
  });

  it('REPLAY INTRO brings the intro back without needing ACCEPT MISSION again', async () => {
    mockReducedMotion();
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Replay Intro/i }));

    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('15/16. UITLOGGEN ends the Supabase session, calls signOut, and brings the Access Gate back', async () => {
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /uitloggen/i }));

    expect(auth.signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument());
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
  });

  it('14. UITLOGGEN is a distinct action from Mission Hunt\'s own WISSEL PERSOON — logging out never touches the locally selected person', async () => {
    const PERSON_KEY = 'wintertrip-mission-hunt-person';
    localStorage.setItem(PERSON_KEY, 'some-profile-id');
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /uitloggen/i }));

    // The shared security session ends, but WIE BEN JIJ?'s own locally
    // selected person is untouched — that's Mission Hunt's own concern.
    expect(localStorage.getItem(PERSON_KEY)).toBe('some-profile-id');
  });
});

describe('App — /mission-updates direct route (via the 404.html redirect param)', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('a direct /mission-updates link never shows app content while there is no session', async () => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth(null) });
    window.history.pushState({}, '', '/?redirect=mission-updates');
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument());
    expect(screen.queryByText(/mission archive/i)).not.toBeInTheDocument();
  });

  it('once a session + the intro are already clear, the direct link lands straight on Mission Updates', async () => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'existing-session' }) });
    sessionStorage.setItem('ws27-intro-seen', '1');
    window.history.pushState({}, '', '/?redirect=mission-updates');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/007 · mission archive/i)).toBeInTheDocument());
    expect(screen.queryByText('Missie #1')).not.toBeInTheDocument();
  });

  it('cleans the redirect param out of the visible URL after restoring the view', async () => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'existing-session' }) });
    sessionStorage.setItem('ws27-intro-seen', '1');
    window.history.pushState({}, '', '/?redirect=mission-updates');

    render(<App />);

    await waitFor(() => expect(window.location.search).toBe(''));
  });
});

describe('App — Mission Hunt: a failed lazy chunk load never black-screens the app', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'existing-session' }) });
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

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
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
