import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MissionHuntPage } from './MissionHuntPage';

const { isSupabaseConfigured, getSupabaseClient, mockAuthState } = vi.hoisted(() => {
  return {
    isSupabaseConfigured: vi.fn(),
    getSupabaseClient: vi.fn(),
    mockAuthState: { session: null as null | { user: { id: string } } },
  };
});

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

/** Minimal fake of the subset of supabase-js's query builder this feature
 * actually calls — enough to drive MissionHuntAuthProvider/useMissionHuntData
 * through a real render without a live Supabase project. */
function buildFakeSupabaseClient(tables: { profiles: unknown[]; projects: unknown[] }) {
  function from(table: 'profiles' | 'projects') {
    const rows = tables[table];
    const builder = {
      select: () => builder,
      eq: (_col: string, _value: string) => builder,
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    return builder;
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: mockAuthState.session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOtp: async () => ({ error: null }),
      signOut: async () => {
        mockAuthState.session = null;
      },
    },
    from,
  };
}

describe('MissionHuntPage — setup required', () => {
  beforeEach(() => {
    mockAuthState.session = null;
  });

  it('shows SETUP REQUIRED and never attempts to connect when Supabase env vars are unset', () => {
    isSupabaseConfigured.mockReturnValue(false);
    render(<MissionHuntPage onNavigateToCalculator={vi.fn()} />);

    expect(screen.getByText(/setup required/i)).toBeInTheDocument();
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe('MissionHuntPage — auth guard', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = null;
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: [], projects: [] }));
  });

  it('an unauthenticated visitor sees the login gate, never Mission Hunt project data', async () => {
    render(<MissionHuntPage onNavigateToCalculator={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /agent login/i })).toBeInTheDocument());
    expect(screen.queryByText(/my projects/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/team mission hunt/i)).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow', () => {
  it('a signed-in, provisioned user reaches My Projects with their own profile', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: 'Bernard', role: 'member', active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [],
      }),
    );

    render(<MissionHuntPage onNavigateToCalculator={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Bernard')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /my projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /team dashboard/i })).toBeInTheDocument();
  });
});
