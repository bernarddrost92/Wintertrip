import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { profileRowToProfile, type ProfileRow } from '../../services/missionHuntMapping';
import type { MissionHuntProfile } from '../../types/missionHunt';
import { MissionHuntAuthContext, type OtpRequestResult, type OtpVerifyResult, type MissionHuntAuthStatus } from './missionHuntAuthContext';

const GENERIC_AUTH_ERROR = 'Kon geen verbinding maken met Mission Hunt. Probeer het opnieuw.';

/**
 * Mission Hunt's own authentication layer, on top of the app's existing
 * Access Gate rather than instead of it — that gate stays a simple
 * device-scoped password check; this is real per-person Supabase Auth,
 * required because Mission Hunt carries client/professional names the
 * Access Gate was never meant to protect.
 *
 * Invite-only: requestOtp always passes shouldCreateUser:false, so a
 * stranger with the public GitHub Pages URL and this device's Access Gate
 * password still cannot create themselves an account. A profile row is
 * auto-provisioned by a DB trigger the instant an invited user's first
 * OTP sign-in completes (see supabase/migrations/0001_mission_hunt.sql),
 * so "signed in" and "has an identity" are never separated by an extra step.
 *
 * First login is a typed 6-digit code, not a clickable magic link: Outlook's
 * Safe Links rewrites and pre-fetches links (which can consume the
 * one-time token before the real click), and a link opened from the Outlook
 * app can land in a different browser than the one this session lives in.
 * A code typed back into the same tab has neither failure mode. The
 * Supabase email template must send {{ .Token }}, not {{ .ConfirmationURL }}
 * — see supabase/migrations for the template note, or the Dashboard's
 * Authentication > Email Templates > Magic Link page.
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

  async function requestOtp(email: string): Promise<OtpRequestResult> {
    try {
      const supabase = getSupabaseClient();
      // No emailRedirectTo: this flow never relies on a clickable link, so
      // there's nothing for it to point at.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        // A rate limit is never account-specific (it's a shared, project-wide
        // email-sending quota) — saying so plainly can't be used to enumerate
        // who has an account, unlike every other failure here, which still
        // gets the deliberately generic message below.
        if (error.code === 'over_email_send_rate_limit') {
          return { ok: false, error: 'Even geduld: er zijn zojuist al veel inlogpogingen geweest. Probeer het over een paar minuten opnieuw.' };
        }
        // Never surface Supabase's raw error text (can leak implementation
        // detail) — a calm, generic message either way, so the invite-only
        // nature of Mission Hunt isn't used to enumerate who has an account.
        return { ok: false, error: 'Kon geen inlogcode versturen. Controleer het e-mailadres en probeer het opnieuw.' };
      }
      setStatus('awaiting_otp');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Kon geen inlogcode versturen. Controleer het e-mailadres en probeer het opnieuw.' };
    }
  }

  async function verifyOtp(email: string, token: string): Promise<OtpVerifyResult> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error) {
        // Covers both a wrong code and a genuinely expired one — GoTrue
        // doesn't reliably distinguish the two, and the user's next action
        // is the same either way: ask for a new code.
        return { ok: false, error: 'Deze code is ongeldig of verlopen. Vraag een nieuwe code aan.' };
      }
      // Session now exists — the onAuthStateChange listener already
      // subscribed in the mount effect above picks it up and moves status
      // to 'signed_in' on its own.
      return { ok: true };
    } catch {
      return { ok: false, error: 'Deze code is ongeldig of verlopen. Vraag een nieuwe code aan.' };
    }
  }

  function returnToEmailStep() {
    setStatus('signed_out');
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
    <MissionHuntAuthContext.Provider value={{ status, profile, errorMessage, requestOtp, verifyOtp, returnToEmailStep, signOut, retry }}>
      {children}
    </MissionHuntAuthContext.Provider>
  );
}
