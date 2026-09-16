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
 */
export function useSupabaseSession(): SupabaseSessionState {
  const [state, setState] = useState<SupabaseSessionState>({ userId: null, ready: !isSupabaseConfigured() });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
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

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
