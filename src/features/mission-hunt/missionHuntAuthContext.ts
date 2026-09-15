import { createContext, useContext } from 'react';
import type { MissionHuntProfile } from '../../types/missionHunt';

export type MissionHuntAuthStatus = 'loading' | 'signed_out' | 'awaiting_magic_link' | 'signed_in';

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

export interface MissionHuntAuthContextValue {
  status: MissionHuntAuthStatus;
  profile: MissionHuntProfile | null;
  requestMagicLink: (email: string) => Promise<MagicLinkResult>;
  signOut: () => Promise<void>;
}

export const MissionHuntAuthContext = createContext<MissionHuntAuthContextValue | null>(null);

export function useMissionHuntAuth(): MissionHuntAuthContextValue {
  const ctx = useContext(MissionHuntAuthContext);
  if (!ctx) throw new Error('useMissionHuntAuth must be used within a MissionHuntAuthProvider');
  return ctx;
}
