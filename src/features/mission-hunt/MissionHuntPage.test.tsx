import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
function buildFakeSupabaseClient(
  tables: {
    profiles: unknown[];
    projects: unknown[];
    team_members?: unknown[];
    placement_reviews?: unknown[];
    placement_talent_managers?: unknown[];
    talent_manager_reviews?: unknown[];
  },
  options: { getSessionNeverResolves?: boolean; profileFetchThrows?: boolean } = {},
) {
  function from(table: 'profiles' | 'projects' | 'team_members' | 'placement_reviews' | 'placement_talent_managers' | 'talent_manager_reviews') {
    const rows = tables[table] ?? [];
    const builder = {
      select: () => builder,
      eq: (_col: string, _value: string) => builder,
      maybeSingle: async () => {
        if (options.profileFetchThrows) throw new Error('network down');
        return { data: rows[0] ?? null, error: null };
      },
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    return builder;
  }

  return {
    auth: {
      getSession: () => (options.getSessionNeverResolves ? new Promise(() => {}) : Promise.resolve({ data: { session: mockAuthState.session } })),
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
    render(<MissionHuntPage />);

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

  it('an unauthenticated visitor sees the login gate, never Mission Hunt placement data', async () => {
    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /agent login/i })).toBeInTheDocument());
    expect(screen.queryByText(/voor vrijdag/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/team check/i)).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, member', () => {
  it('a signed-in member lands directly on My Placements with no tab bar at all', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: 'Lisa', email_normalized: 'lisa@maandag.com', role: 'member', active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [],
      }),
    );

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    expect(screen.getByText(/voor vrijdag/i)).toBeInTheDocument();
    // A normal member never sees an admin/team tab bar at all.
    expect(screen.queryByRole('button', { name: /team placement import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /friday review/i })).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, admin', () => {
  it('Bernard (admin) sees all three tabs: My Placements, Team Placement Import, Friday Review', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: 'Bernard', email_normalized: 'bernard.drost@maandag.com', role: 'admin', active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [],
      }),
    );

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('Bernard')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^my placements$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /team placement import/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /friday review/i })).toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, manager/office_manager', () => {
  it.each([
    ['manager', 'Jordan'],
    ['office_manager', 'Marre'],
  ])('%s gets the same three operational tabs as admin', async (role, name) => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: name, email_normalized: `${name.toLowerCase()}@maandag.com`, role, active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [],
      }),
    );

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText(name)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^my placements$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /team placement import/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /friday review/i })).toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, hr', () => {
  it('hr lands directly on the read-only Friday Review overview, with no tab bar and no My Placements/add affordance', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: 'Maureen B', email_normalized: 'maureen.bokkers@maandag.com', role: 'hr', active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [],
      }),
    );

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText(/team zwolle/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^my placements$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /team placement import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /friday review/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/voor vrijdag/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /plaatsing toevoegen/i })).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — a single AM+TM login exposes both perspectives without duplicating team totals', () => {
  it('shows the AM\'s own placement in My Placements AND a colleague\'s TM-linked placement in My Professionals, as two distinct, non-overlapping counts', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: [{ id: 'p1', user_id: 'user-1', display_name: 'Kim', email_normalized: 'kim.schuring@maandag.com', role: 'member', active: true, created_at: '2026-09-01T00:00:00Z' }],
        projects: [
          {
            id: 'own-1',
            owner_id: 'user-1',
            owner_email: 'kim.schuring@maandag.com',
            owner_display_name: 'Kim',
            professional_name: 'Kim Own Professional',
            client_name: 'Klant Own',
            start_date: '2026-10-01',
            end_date: '2026-12-31',
            hours_per_week: 24,
            monthly_vcdb: 10,
            note: null,
            fingerprint: 'fp-own',
            created_at: 'x',
            updated_at: 'x',
          },
          {
            id: 'colleague-1',
            owner_id: null,
            owner_email: 'jurgen.vandijk@maandag.com',
            owner_display_name: 'Jurgen',
            professional_name: 'Jurgen Linked Professional',
            client_name: 'Klant Linked',
            start_date: '2026-10-01',
            end_date: '2026-12-31',
            hours_per_week: 24,
            monthly_vcdb: 10,
            note: null,
            fingerprint: 'fp-colleague',
            created_at: 'x',
            updated_at: 'x',
          },
        ],
        placement_talent_managers: [
          { id: 'link-1', project_id: 'colleague-1', talent_manager_email: 'kim.schuring@maandag.com', talent_manager_id: null, talent_manager_display_name: 'Kim', created_at: 'x' },
        ],
      }),
    );

    render(<MissionHuntPage />);

    // My Placements (AM perspective) and My Professionals (TM perspective,
    // additive) render simultaneously for a plain member with both — each
    // placement shows exactly once, in its own section, never duplicated
    // or merged into the other's count.
    await waitFor(() => expect(screen.getByText('Kim Own Professional')).toBeInTheDocument());
    expect(screen.getByText('Jurgen Linked Professional')).toBeInTheDocument();
    expect(screen.getAllByText('Kim Own Professional')).toHaveLength(1);
    expect(screen.getAllByText('Jurgen Linked Professional')).toHaveLength(1);

    // My Professionals groups the TM-linked placement by its real AM.
    expect(screen.getByText(/mijn professionals/i)).toBeInTheDocument();
    expect(screen.getByText(/jurgen — 1/i)).toBeInTheDocument();
  });
});

describe('MissionHuntPage — loading state renders', () => {
  it('shows an "authenticating agent" loading state, never a blank screen, while the session check is pending', () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = null;
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: [], projects: [] }, { getSessionNeverResolves: true }));

    render(<MissionHuntPage />);

    expect(screen.getByText(/authenticating agent/i)).toBeInTheDocument();
  });
});

describe('MissionHuntPage — editing a placement after ALLES KLOPT refetches and clears the confirmation', () => {
  it('the ALLES KLOPT banner disappears once the server-side trigger has invalidated it, without a full page reload', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };

    const placementRow = {
      id: 'pl-1',
      owner_id: 'user-1',
      owner_email: 'bernard.drost@maandag.com',
      owner_display_name: 'Bernard',
      professional_name: 'Test Professional',
      client_name: 'Test Klant',
      start_date: '2026-10-01',
      end_date: '2026-12-31',
      hours_per_week: 24,
      monthly_vcdb: 10,
      note: null,
      fingerprint: 'fp-1',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    };
    // Mutable — the fake DB's placement_reviews table. The mocked update()
    // below simulates the real invalidation trigger by clearing this the
    // instant the placement is edited, exactly like migration 0006 does.
    const reviewsTable: unknown[] = [
      { id: 'r-1', user_id: 'user-1', user_email: 'bernard.drost@maandag.com', verified_at: '2026-09-16T13:42:00Z', placement_count_at_verification: 1, created_at: 'x' },
    ];

    function from(table: string) {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: 'p1', user_id: 'user-1', display_name: 'Bernard', email_normalized: 'bernard.drost@maandag.com', role: 'admin', active: true, created_at: 'x' }, error: null }) }),
            then: (resolve: (v: unknown) => void) =>
              resolve({ data: [{ id: 'p1', user_id: 'user-1', display_name: 'Bernard', email_normalized: 'bernard.drost@maandag.com', role: 'admin', active: true, created_at: 'x' }], error: null }),
          }),
        };
      }
      if (table === 'projects') {
        return {
          select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [placementRow], error: null }) }),
          update: (patch: Record<string, unknown>) => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  Object.assign(placementRow, patch);
                  reviewsTable.length = 0; // the real trigger deletes Bernard's review row.
                  return { data: { ...placementRow }, error: null };
                },
              }),
            }),
          }),
        };
      }
      if (table === 'team_members') return { select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }) }) };
      if (table === 'placement_reviews') return { select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [...reviewsTable], error: null }) }) };
      if (table === 'placement_talent_managers') return { select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }) }) };
      if (table === 'talent_manager_reviews') return { select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }) }) };
      throw new Error(`unexpected table ${table}`);
    }

    getSupabaseClient.mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockAuthState.session } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from,
    });

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText(/gecontroleerd/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /alles klopt/i })).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByText('Test Professional'));
    const hoursField = await screen.findByLabelText(/uren per week/i);
    await userEvent.setup().clear(hoursField);
    await userEvent.setup().type(hoursField, '30');
    await userEvent.setup().tab();

    await waitFor(() => expect(screen.getByRole('button', { name: /alles klopt/i })).toBeInTheDocument());
    expect(screen.queryByText(/gecontroleerd/i)).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — profile fetch error renders a safe error state', () => {
  it('never black-screens when the profiles query throws — shows System Error + Retry instead', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthState.session = { user: { id: 'user-1' } };
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: [], projects: [] }, { profileFetchThrows: true }));

    const { container } = render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('System Error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    // A real render happened — this is not an empty/unmounted tree.
    expect(container.textContent).not.toBe('');
  });
});
