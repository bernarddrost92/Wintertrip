import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { profileRowToProfile, type ProfileRow } from '../../services/missionHuntMapping';
import type { MissionHuntProfile } from '../../types/missionHunt';
import { MissionHuntAuthContext, type MagicLinkResult, type MissionHuntAuthStatus } from './missionHuntAuthContext';

const GENERIC_AUTH_ERROR = 'Kon geen verbinding maken met Mission Hunt. Probeer het opnieuw.';

/**
 * Mission Hunt's own authentication layer, on top of the app's existing
 * Access Gate rather than instead of it — that gate stays a simple
 * device-scoped password check; this is real per-person Supabase Auth,
 * required because Mission Hunt carries client/professional names the
 * Access Gate was never meant to protect.
 *
 * Invite-only: requestMagicLink always passes shouldCreateUser:false, so a
 * stranger with the public GitHub Pages URL and this device's Access Gate
 * password still cannot create themselves an account. A profile row is
 * auto-provisioned by a DB trigger the instant an invited user's first
 * magic-link sign-in completes (see supabase/migrations/0001_mission_hunt.sql),
 * so "signed in" and "has an identity" are never separated by an extra step.
 *
 * Every Supabase call in the mount-time effect is wrapped so nothing here
 * can throw or reject uncaught: a genuine failure (network down, RLS
 * rejecting the query, an unexpected response shape) always lands in
 * status 'error' with a safe generic message — never left to become an
 * uncaught render/effect error, which (confirmed by direct reproduction)
 * has no Error Boundary to stop it from unmounting the entire app.
 */
export function MissionHuntAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MissionHuntAuthStatus>('loading');
  const [profile, setProfile] = useState<MissionHuntProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    async function loadProfileFor(session: Session) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle<ProfileRow>();
        if (cancelled) return;
        if (error) {
          setStatus('error');
          setErrorMessage(GENERIC_AUTH_ERROR);
          return;
        }
        if (!data) {
          // Signed in but not provisioned yet (trigger lag, or a user who
          // predates the trigger) — not an error, just not ready; falling
          // back to the login screen is harmless (re-requesting a magic
          // link is a no-op once the profile exists).
          setProfile(null);
          setStatus('signed_out');
          return;
        }
        setProfile(profileRowToProfile(data));
        setStatus('signed_in');
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(GENERIC_AUTH_ERROR);
      }
    }

    async function init() {
      try {
        const supabase = getSupabaseClient();

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          await loadProfileFor(data.session);
        } else {
          setStatus('signed_out');
        }
        if (cancelled) return;

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          try {
            if (session) {
              loadProfileFor(session);
            } else {
              setProfile(null);
              setStatus('signed_out');
            }
          } catch {
            setStatus('error');
            setErrorMessage(GENERIC_AUTH_ERROR);
          }
        });
        unsubscribe = () => subscription.subscription.unsubscribe();
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(GENERIC_AUTH_ERROR);
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [retryToken]);

  function retry() {
    setStatus('loading');
    setErrorMessage(null);
    setRetryToken((t) => t + 1);
  }

  async function requestMagicLink(email: string): Promise<MagicLinkResult> {
    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      if (error) {
        // Never surface Supabase's raw error text (can leak implementation
        // detail) — a calm, generic message either way, so the invite-only
        // nature of Mission Hunt isn't used to enumerate who has an account.
        return { ok: false, error: 'Kon geen inloglink versturen. Controleer het e-mailadres en probeer het opnieuw.' };
      }
      setStatus('awaiting_magic_link');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Kon geen inloglink versturen. Controleer het e-mailadres en probeer het opnieuw.' };
    }
  }

  async function signOut() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Sign-out is a best-effort cleanup — even if the network call fails,
      // clearing local state below still gets the user back to a clean,
      // usable login screen rather than stuck signed-in-looking state.
    }
    setProfile(null);
    setErrorMessage(null);
    setStatus('signed_out');
  }

  return (
    <MissionHuntAuthContext.Provider value={{ status, profile, errorMessage, requestMagicLink, signOut, retry }}>
      {children}
    </MissionHuntAuthContext.Provider>
  );
}
