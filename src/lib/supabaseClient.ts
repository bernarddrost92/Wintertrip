import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Shape checks only, not a real validator — but enough to catch the one
 * mistake that matters here: a key pasted into the URL slot (or vice
 * versa), which the CI preflight (.github/workflows/deploy.yml) is meant to
 * catch before a build ever embeds it, but a bad local .env/.env.local or a
 * future deploy path without that preflight should never be treated as
 * "configured" either. */
function looksLikeSupabaseUrl(value: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value);
}

function looksLikeClientSafeKey(value: string): boolean {
  // A secret key (sb_secret_...) must never be treated as usable client-side
  // — it bypasses RLS entirely. Accept the modern publishable key or a
  // legacy anon JWT.
  return /^sb_publishable_/.test(value) || /^eyJ/.test(value);
}

/**
 * Mission Hunt's only backend dependency. Both env vars are optional across
 * the app as a whole — everything else (Calculator, League Check, Mission
 * Control, Mission Updates) works with zero Supabase configuration. Mission
 * Hunt itself checks isSupabaseConfigured() and renders a "SETUP REQUIRED"
 * state instead of calling any of this when it's false, so this module never
 * throws at import time even with nothing configured. Garbage config (e.g. a
 * key pasted into the URL slot) is treated the same as unconfigured, never
 * passed to createClient().
 */
export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  return looksLikeSupabaseUrl(SUPABASE_URL) && looksLikeClientSafeKey(SUPABASE_ANON_KEY);
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
