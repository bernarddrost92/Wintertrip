import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabaseClient';

/**
 * The ONE shared Team Zwolle Supabase Auth account — the security gate for
 * the whole app. This email is a fixed, non-secret identifier (the UI never
 * shows or asks for it); the actual shared password lives only inside
 * Supabase Auth. There is no personal email login, OTP, or magic link
 * anywhere in this flow — every team member signs into this same technical
 * account, then WIE BEN JIJ? (personStorage.ts) picks their own identity on
 * top of it, completely independently.
 */
export const TEAM_ZWOLLE_EMAIL = 'teamzwolle@wintertrip.internal';

export type SignInResult = { ok: true } | { ok: false; reason: 'invalid-credentials' | 'network' };

/** Never rejects — every failure mode (wrong password, Supabase unreachable,
 * not configured) resolves to a typed reason so AccessGate never has to
 * catch a raw Supabase error itself. */
export async function signInTeamZwolle(password: string): Promise<SignInResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'network' };
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email: TEAM_ZWOLLE_EMAIL, password });
    if (error) {
      const reason = /invalid login credentials/i.test(error.message) ? 'invalid-credentials' : 'network';
      return { ok: false, reason };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** UITLOGGEN — ends the shared Supabase session. Never confuse this with
 * WISSEL PERSOON (personStorage.ts's clearSelectedPersonId), which only
 * clears the locally selected Mission Hunt person and leaves this session
 * untouched. */
export async function signOutTeamZwolle(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // best-effort — onAuthStateChange below reflects the real session state
    // regardless, so there is nothing else useful to do client-side here.
  }
}

interface SupabaseSessionState {
  loading: boolean;
  session: Session | null;
}

/**
 * The single source of truth for "is there currently a valid Team Zwolle
 * Supabase session" — read once at the very top of the app (App.tsx) to
 * decide whether to show the shared password screen or the app itself.
 * persistSession/autoRefreshToken are already configured on the client
 * (supabaseClient.ts), so a page refresh or a reopened browser resolves
 * getSession() from the persisted/auto-refreshed session with no re-prompt.
 */
export function useSupabaseAuthSession(): SupabaseSessionState {
  const [state, setState] = useState<SupabaseSessionState>({ loading: true, session: null });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ loading: false, session: null });
      return;
    }

    const supabase = getSupabaseClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setState({ loading: false, session: data.session });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState({ loading: false, session });
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
