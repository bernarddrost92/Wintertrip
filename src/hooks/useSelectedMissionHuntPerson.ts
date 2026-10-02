import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { getSelectedPersonId, setSelectedPersonId } from '../features/mission-hunt/personStorage';

interface SelectedPersonState {
  /** null when nobody has selected a name yet on this device (or Supabase
   * isn't configured, or the lookup failed) — the same "not registered
   * yet" outcome for League Check Intelligence either way. */
  userId: string | null;
  /** false only during the brief initial lookup. */
  ready: boolean;
}

/** Resolves a profiles.id to its auth.users id, or null when that isn't
 * possible for any reason. Never throws — see the hook's comment below. */
async function resolveUserId(personId: string | null): Promise<string | null> {
  if (!personId || !isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('profiles').select('user_id').eq('id', personId).maybeSingle<{ user_id: string }>();
    return !error && data ? data.user_id : null;
  } catch {
    return null;
  }
}

/**
 * A minimal, feature-agnostic read of "who is currently selected on this
 * device" (Mission Hunt's WIE BEN JIJ? picker — see personStorage.ts),
 * independent of Mission Hunt's own roster hook: League Check Intelligence
 * only needs a person's auth.users id to attribute a receipt to, not a
 * Mission Hunt profile row or its own roster fetch.
 *
 * League Check must work with zero Supabase dependency (see League Check's
 * own tests) — this hook is mounted unconditionally by every receipt flow,
 * so nothing in its effect may ever throw synchronously (same guard as the
 * hook this replaces: getSupabaseClient() itself calls createClient(),
 * which can throw synchronously for config that merely *looks* plausible
 * enough to pass isSupabaseConfigured() but still isn't usable).
 */
export function useSelectedMissionHuntPerson(): SelectedPersonState & { selectPerson: (personId: string) => Promise<string | null> } {
  const [state, setState] = useState<SelectedPersonState>({ userId: null, ready: false });

  useEffect(() => {
    let cancelled = false;

    resolveUserId(getSelectedPersonId()).then((userId) => {
      if (!cancelled) setState({ userId, ready: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /** The WIE BEN JIJ? choice: remembered on this device, then resolved. */
  const selectPerson = useCallback(async (personId: string) => {
    setSelectedPersonId(personId);
    const userId = await resolveUserId(personId);
    setState({ userId, ready: true });
    return userId;
  }, []);

  return { ...state, selectPerson };
}
