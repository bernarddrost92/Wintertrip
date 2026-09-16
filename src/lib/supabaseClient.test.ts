import { afterEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn((_url: string, _key: string, _options: { auth: Record<string, boolean> }) => ({ auth: {} })),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));

/**
 * Regression coverage for a real production incident: VITE_SUPABASE_URL was
 * set to a Supabase secret key (sb_secret_...) instead of the project URL —
 * garbage the app nonetheless treated as "configured" and would have handed
 * straight to createClient(). isSupabaseConfigured() must now reject
 * anything that doesn't look like an actual https://<ref>.supabase.co URL
 * paired with a client-safe (publishable/anon) key.
 *
 * import.meta.env is read once at module load, so each case resets modules
 * and re-imports after stubbing.
 */
async function loadWithEnv(url: string | undefined, key: string | undefined) {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', url as string);
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', key as string);
  return import('./supabaseClient');
}

describe('isSupabaseConfigured — rejects garbage config, not just missing config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('both unset: not configured', async () => {
    const { isSupabaseConfigured } = await loadWithEnv(undefined, undefined);
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('a real URL and a legacy JWT anon key: configured', async () => {
    const { isSupabaseConfigured } = await loadWithEnv(
      'https://example-project-ref.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature',
    );
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('a real URL and a modern publishable key: configured', async () => {
    const { isSupabaseConfigured } = await loadWithEnv('https://example-project-ref.supabase.co', 'sb_publishable_abc123');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('the actual incident: a secret key in the URL slot — not configured, regardless of the key slot', async () => {
    const { isSupabaseConfigured } = await loadWithEnv('sb_secret_not_a_real_key_placeholder', 'sb_publishable_abc123');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('a secret key in the ANON_KEY slot: not configured — never treat a secret key as client-safe', async () => {
    const { isSupabaseConfigured } = await loadWithEnv('https://example-project-ref.supabase.co', 'sb_secret_not_a_real_key_placeholder');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('a non-Supabase URL: not configured', async () => {
    const { isSupabaseConfigured } = await loadWithEnv('https://example.com', 'sb_publishable_abc123');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('URL set but key missing: not configured', async () => {
    const { isSupabaseConfigured } = await loadWithEnv('https://example-project-ref.supabase.co', undefined);
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe('getSupabaseClient — session persistence config and singleton', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    createClientMock.mockClear();
  });

  it('createClient is called with persistSession/autoRefreshToken/detectSessionInUrl all true — the whole "stay signed in" contract rests on this', async () => {
    const { getSupabaseClient } = await loadWithEnv('https://example-project-ref.supabase.co', 'sb_publishable_abc123');
    getSupabaseClient();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    const [, , options] = createClientMock.mock.calls[0];
    expect(options.auth).toEqual({ autoRefreshToken: true, persistSession: true, detectSessionInUrl: true });
  });

  it('is a singleton — every caller across the app (Mission Hunt auth, League Check\'s session hook, a remount after navigating away and back) shares one client and one in-memory session, never re-creating it', async () => {
    const { getSupabaseClient } = await loadWithEnv('https://example-project-ref.supabase.co', 'sb_publishable_abc123');

    const first = getSupabaseClient();
    const second = getSupabaseClient();
    const third = getSupabaseClient();

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
