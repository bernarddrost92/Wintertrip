import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { profileRowToProfile, type ProfileRow } from '../../services/missionHuntMapping';
import type { MissionHuntProfile } from '../../types/missionHunt';

interface RosterState {
  loading: boolean;
  error: string | null;
  profiles: MissionHuntProfile[];
}

const GENERIC_ERROR = 'Kon het teamoverzicht niet laden. Probeer het opnieuw.';

/**
 * The full team roster (public.profiles), readable without any session —
 * this is the one thing Mission Hunt needs before a person has even been
 * selected (the WIE BEN JIJ? picker), and it doubles as the initial check
 * for "do we already have a remembered person" on every load.
 */
export function useMissionHuntRoster() {
  const [state, setState] = useState<RosterState>({ loading: true, error: null, profiles: [] });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error || !data) {
        setState({ loading: false, error: GENERIC_ERROR, profiles: [] });
        return;
      }
      setState({ loading: false, error: null, profiles: (data as ProfileRow[]).map(profileRowToProfile) });
    } catch {
      setState({ loading: false, error: GENERIC_ERROR, profiles: [] });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
