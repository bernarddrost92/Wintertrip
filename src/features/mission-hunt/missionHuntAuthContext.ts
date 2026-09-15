import { createContext, useContext } from 'react';
import type { MissionHuntProfile } from '../../types/missionHunt';

export type MissionHuntAuthStatus = 'loading' | 'signed_out' | 'awaiting_magic_link' | 'signed_in' | 'error';

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

export interface MissionHuntAuthContextValue {
  status: MissionHuntAuthStatus;
  profile: MissionHuntProfile | null;
  /** Set only when status === 'error' — a Supabase call reachable but
   * failing (network error, RLS rejection, unexpected shape). Never the
   * raw Supabase error text; always this safe, generic message. */
  errorMessage: string | null;
  requestMagicLink: (email: string) => Promise<MagicLinkResult>;
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
