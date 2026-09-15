import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { profileRowToProfile, type ProfileRow } from '../../services/missionHuntMapping';
import type { MissionHuntProfile } from '../../types/missionHunt';
import { MissionHuntAuthContext, type MagicLinkResult, type MissionHuntAuthStatus } from './missionHuntAuthContext';

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
 */
export function MissionHuntAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MissionHuntAuthStatus>('loading');
  const [profile, setProfile] = useState<MissionHuntProfile | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    async function loadProfileFor(session: Session) {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle<ProfileRow>();
      if (cancelled) return;
      if (error || !data) {
        // Signed in but not provisioned yet (trigger lag, or a user who
        // predates the trigger) — never crash, just stay signed-out-shaped
        // rather than showing a broken half-signed-in screen.
        setProfile(null);
        setStatus('signed_out');
        return;
      }
      setProfile(profileRowToProfile(data));
      setStatus('signed_in');
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        loadProfileFor(data.session);
      } else {
        setStatus('signed_out');
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) {
        loadProfileFor(session);
      } else {
        setProfile(null);
        setStatus('signed_out');
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function requestMagicLink(email: string): Promise<MagicLinkResult> {
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
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setProfile(null);
    setStatus('signed_out');
  }

  return <MissionHuntAuthContext.Provider value={{ status, profile, requestMagicLink, signOut }}>{children}</MissionHuntAuthContext.Provider>;
}
