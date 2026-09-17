import { useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { getSelectedPersonId } from '../features/mission-hunt/personStorage';

interface SelectedPersonState {
  /** null when nobody has selected a name yet on this device (or Supabase
   * isn't configured, or the lookup failed) — the same "not registered
   * yet" outcome for League Check Intelligence either way. */
  userId: string | null;
  /** false only during the brief initial lookup. */
  ready: boolean;
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
export function useSelectedMissionHuntPerson(): SelectedPersonState {
  const [state, setState] = useState<SelectedPersonState>({ userId: null, ready: false });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const personId = getSelectedPersonId();
      if (!personId || !isSupabaseConfigured()) {
        if (!cancelled) setState({ userId: null, ready: true });
        return;
      }
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('profiles').select('user_id').eq('id', personId).maybeSingle<{ user_id: string }>();
        if (cancelled) return;
        setState({ userId: !error && data ? data.user_id : null, ready: true });
      } catch {
        if (!cancelled) setState({ userId: null, ready: true });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
