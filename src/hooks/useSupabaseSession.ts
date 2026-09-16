import { useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

interface SupabaseSessionState {
  /** null while signed out, unconfigured, or not yet resolved. */
  userId: string | null;
  /** false only during the brief initial getSession() round-trip. */
  ready: boolean;
}

/**
 * A minimal, feature-agnostic read of the same Supabase Auth session Mission
 * Hunt signs into (same client singleton, same persisted session — signing
 * in once via Mission Hunt's magic link is enough for this hook to see it
 * too). Deliberately independent of MissionHuntAuthProvider/its profile
 * lookup: League Check Intelligence only needs a user id to attribute a
 * receipt to, not a Mission Hunt profile row.
 *
 * League Check must work with zero Supabase dependency (see League Check's
 * own tests) — this hook is mounted unconditionally by every receipt flow,
 * so nothing in its effect may ever throw synchronously. getSupabaseClient()
 * itself calls createClient(), which can throw synchronously for config
 * that merely *looks* plausible enough to pass isSupabaseConfigured() but
 * still isn't a usable client (and did, in production, when a misconfigured
 * secret briefly put a non-URL string in the URL slot — an uncaught throw
 * here inside useEffect, with no error boundary anywhere near League Check,
 * took the whole page down). Every synchronous and asynchronous path below
 * is therefore guarded: any failure resolves to the same safe
 * { userId: null, ready: true } a signed-out visitor gets, never a thrown
 * error.
 */
export function useSupabaseSession(): SupabaseSessionState {
  const [state, setState] = useState<SupabaseSessionState>({ userId: null, ready: !isSupabaseConfigured() });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    try {
      const supabase = getSupabaseClient();

      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (cancelled) return;
          setState({ userId: data.session?.user.id ?? null, ready: true });
        })
        .catch(() => {
          if (!cancelled) setState({ userId: null, ready: true });
        });

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        setState({ userId: session?.user.id ?? null, ready: true });
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    } catch {
      // getSupabaseClient()/createClient() threw synchronously — treat
      // exactly like signed-out/unconfigured rather than crash the page.
      if (!cancelled) setState({ userId: null, ready: true });
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}
