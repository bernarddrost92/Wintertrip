import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TEAM_ZWOLLE_EMAIL, signInTeamZwolle, signOutTeamZwolle, useSupabaseAuthSession } from './teamZwolleAuth';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

function fakeAuth() {
  return {
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  };
}

describe('signInTeamZwolle', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
  });

  it('signs in with the fixed technical email — the caller never supplies or sees an email', async () => {
    const auth = fakeAuth();
    auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    getSupabaseClient.mockReturnValue({ auth });

    const result = await signInTeamZwolle('correct-password');

    expect(result).toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: TEAM_ZWOLLE_EMAIL, password: 'correct-password' });
    expect(TEAM_ZWOLLE_EMAIL).toBe('teamzwolle@wintertrip.internal');
  });

  it('an invalid-credentials error from Supabase maps to reason "invalid-credentials"', async () => {
    const auth = fakeAuth();
    auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });
    getSupabaseClient.mockReturnValue({ auth });

    expect(await signInTeamZwolle('wrong')).toEqual({ ok: false, reason: 'invalid-credentials' });
  });

  it('any other Supabase error maps to reason "network"', async () => {
    const auth = fakeAuth();
    auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'rate limited' } });
    getSupabaseClient.mockReturnValue({ auth });

    expect(await signInTeamZwolle('whatever')).toEqual({ ok: false, reason: 'network' });
  });

  it('a thrown/rejected call never throws out of signInTeamZwolle — it resolves reason "network"', async () => {
    const auth = fakeAuth();
    auth.signInWithPassword.mockRejectedValue(new Error('fetch failed'));
    getSupabaseClient.mockReturnValue({ auth });

    await expect(signInTeamZwolle('whatever')).resolves.toEqual({ ok: false, reason: 'network' });
  });

  it('resolves reason "network" without ever calling Supabase when not configured', async () => {
    isSupabaseConfigured.mockReturnValue(false);

    expect(await signInTeamZwolle('whatever')).toEqual({ ok: false, reason: 'network' });
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe('signOutTeamZwolle', () => {
  it('calls supabase.auth.signOut() when configured', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const auth = fakeAuth();
    getSupabaseClient.mockReturnValue({ auth });

    await signOutTeamZwolle();

    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('never throws even if the underlying signOut call rejects', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const auth = fakeAuth();
    auth.signOut.mockRejectedValue(new Error('network down'));
    getSupabaseClient.mockReturnValue({ auth });

    await expect(signOutTeamZwolle()).resolves.toBeUndefined();
  });

  it('is a no-op when not configured', async () => {
    isSupabaseConfigured.mockReturnValue(false);

    await signOutTeamZwolle();

    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe('useSupabaseAuthSession', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
  });

  it('resolves loading:false, session:null when not configured — no Supabase calls made', async () => {
    isSupabaseConfigured.mockReturnValue(false);
    const { result } = renderHook(() => useSupabaseAuthSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('resolves the persisted session from getSession() on mount', async () => {
    const auth = fakeAuth();
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'persisted' } } });
    getSupabaseClient.mockReturnValue({ auth });

    const { result } = renderHook(() => useSupabaseAuthSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual({ access_token: 'persisted' });
  });

  it('updates live when onAuthStateChange fires (a sign-in or sign-out elsewhere in the app)', async () => {
    let changeCallback: ((event: string, session: unknown) => void) | null = null;
    const auth = fakeAuth();
    auth.onAuthStateChange.mockImplementation((cb) => {
      changeCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSupabaseClient.mockReturnValue({ auth });

    const { result } = renderHook(() => useSupabaseAuthSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();

    act(() => {
      changeCallback?.('SIGNED_IN', { access_token: 'new-session' });
    });

    expect(result.current.session).toEqual({ access_token: 'new-session' });

    act(() => {
      changeCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.session).toBeNull();
  });

  it('unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    const auth = fakeAuth();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    getSupabaseClient.mockReturnValue({ auth });

    const { unmount } = renderHook(() => useSupabaseAuthSession());
    await waitFor(() => expect(auth.getSession).toHaveBeenCalled());

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
