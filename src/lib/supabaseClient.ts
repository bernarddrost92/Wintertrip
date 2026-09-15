import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Mission Hunt's only backend dependency. Both env vars are optional across
 * the app as a whole — everything else (Calculator, League Check, Mission
 * Control, Mission Updates) works with zero Supabase configuration. Mission
 * Hunt itself checks isSupabaseConfigured() and renders a "SETUP REQUIRED"
 * state instead of calling any of this when it's false, so this module never
 * throws at import time even with nothing configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

/** Lazily creates the client on first use — never at module load, so an
 * unconfigured deployment never pays for or risks a bad createClient() call
 * just from importing this file. Throws only if called while unconfigured;
 * callers must check isSupabaseConfigured() first. */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — check isSupabaseConfigured() before calling getSupabaseClient().');
  }
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
