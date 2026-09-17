import { createContext, useContext } from 'react';
import type { MissionHuntProfile } from '../../types/missionHunt';

export type MissionHuntAuthStatus = 'loading' | 'signed_out' | 'awaiting_otp' | 'signed_in' | 'error';

export type OtpRequestResult = { ok: true } | { ok: false; error: string };
export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

export interface MissionHuntAuthContextValue {
  status: MissionHuntAuthStatus;
  profile: MissionHuntProfile | null;
  /** Set only when status === 'error' — a Supabase call reachable but
   * failing (network error, RLS rejection, unexpected shape). Never the
   * raw Supabase error text; always this safe, generic message. */
  errorMessage: string | null;
  /** Sends the 6-digit login code to email (shouldCreateUser stays false —
   * invite-only). On success, status becomes 'awaiting_otp'. */
  requestOtp: (email: string) => Promise<OtpRequestResult>;
  /** Verifies the 6-digit code the user typed back in. On success the
   * existing onAuthStateChange listener picks up the new session and
   * status moves to 'signed_in' on its own — no separate call needed. */
  verifyOtp: (email: string, token: string) => Promise<OtpVerifyResult>;
  /** Local-only: returns from the OTP step to the email step (e.g. "ANDER
   * E-MAILADRES"). Never touches the Supabase session — there isn't one
   * yet at this point in the flow — so it's safe even if that ever
   * changes, unlike calling signOut() would be. */
  returnToEmailStep: () => void;
  signOut: () => Promise<void>;
  /** Re-runs the session/profile check from scratch — used by the RETRY
   * action on the error state. */
  retry: () => void;
}

export const MissionHuntAuthContext = createContext<MissionHuntAuthContextValue | null>(null);

export function useMissionHuntAuth(): MissionHuntAuthContextValue {
  const ctx = useContext(MissionHuntAuthContext);
  if (!ctx) throw new Error('useMissionHuntAuth must be used within a MissionHuntAuthProvider');
  return ctx;
}
