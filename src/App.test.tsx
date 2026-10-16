import { render, screen, waitFor, within } from '@testing-library/react';
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

  it('14. UITLOGGEN never touches the locally selected WIE BEN JIJ? person', async () => {
    const PERSON_KEY = 'wintertrip-mission-hunt-person';
    localStorage.setItem(PERSON_KEY, 'some-profile-id');
    sessionStorage.setItem('ws27-intro-seen', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /uitloggen/i }));

    // The shared security session ends, but WIE BEN JIJ?'s own locally
    // selected person is untouched — League Check still registers under it.
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

describe('App — Mission Hunt is no longer part of the site', () => {
  beforeEach(() => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'existing-session' }) });
    sessionStorage.setItem('ws27-intro-seen', '1');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('the header shows the new structure: Mission Home, Score Check, Net FTE, Mission Control, Mission Updates', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    const nav = within(screen.getByRole('navigation', { name: /hoofdnavigatie/i }));
    expect(nav.getAllByRole('button').map((b) => b.textContent)).toEqual(['Mission Home', 'Score Check', 'Net FTE', 'Mission Control', 'Mission Updates']);
  });

  it('the header has no Mission Hunt entry', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Mission Hunt' })).not.toBeInTheDocument();
  });

  it('an old bookmarked /mission-hunt link lands on the Mission Homepage', async () => {
    window.history.pushState({}, '', '/?redirect=mission-hunt');
    render(<App />);

    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    expect(screen.queryByText(/project intelligence/i)).not.toBeInTheDocument();
  });
});

describe('App — QUIET MODE ↔ HUNT MODE', () => {
  beforeEach(() => {
    getSupabaseClient.mockReturnValue({ auth: createFakeAuth({ access_token: 'existing-session' }) });
    sessionStorage.setItem('ws27-intro-seen', '1');
    mockReducedMotion();
  });

  afterEach(() => {
    sessionStorage.removeItem('ws27-hunt-mode');
  });

  it('starts in QUIET MODE: the mission ribbon shows, Hunt Mode does not', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    expect(screen.getByRole('switch', { name: /hunt mode/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('mission-ribbon')).toHaveTextContent(/VCDB #\d+/);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('the switch opens Hunt Mode on the hero; Escape closes it back to Quiet', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());

    await user.click(screen.getByRole('switch', { name: /hunt mode/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /the net fte hunt is on/i })).toBeInTheDocument();
    expect(sessionStorage.getItem('ws27-hunt-mode')).toBe('1');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /hunt mode/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Missie #1')).toBeInTheDocument();
  });

  it('PAK JE FTE-BON closes Hunt Mode and lands on the existing FTE Bon Calculator', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());

    await user.click(screen.getByRole('switch', { name: /hunt mode/i }));
    await user.click(screen.getByRole('button', { name: /pak je fte-bon/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Net FTE' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/groei in fte/i)).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalled();
    scrollIntoView.mockRestore();
  });

  it('a deliberate switch plays the MISSION ACTIVATED moment, then lands on the hero', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    await user.click(screen.getByRole('switch', { name: /hunt mode/i }));
    expect(screen.getByTestId('hunt-activation')).toHaveTextContent(/mission activated/i);
    expect(screen.getByTestId('gold-confetti')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /the net fte hunt is on/i })).toBeInTheDocument();
  });

  it('soundtrack: the switch uses the existing start flow once; reveals and the War Room never restart or pause it', async () => {
    const play = window.HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
    const pause = window.HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    play.mockClear();
    pause.mockClear();

    await user.click(screen.getByRole('switch', { name: /hunt mode/i }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(document.querySelectorAll('audio')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /geef mij een missie/i }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /geef me vuur/i }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /open war room/i }));
    await user.keyboard('{Escape}');

    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('the ribbon’s PAK FTE-BON goes to the calculator too', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Missie #1')).toBeInTheDocument());
    await user.click(within(screen.getByTestId('mission-ribbon')).getByRole('button', { name: /pak fte-bon/i }));
    expect(screen.getByRole('heading', { name: 'Net FTE' })).toBeInTheDocument();
  });

  it('a reload within the session restores Hunt Mode without replaying the activation', async () => {
    sessionStorage.setItem('ws27-hunt-mode', '1');
    render(<App />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.queryByTestId('hunt-activation')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /the net fte hunt is on/i })).toBeInTheDocument();
  });
});
