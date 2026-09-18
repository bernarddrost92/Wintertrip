import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MissionHuntPage } from './MissionHuntPage';
import { setSelectedPersonId, getSelectedPersonId } from './personStorage';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

/** Minimal fake of the subset of supabase-js's query builder this feature
 * actually calls — enough to drive useMissionHuntRoster/useMissionHuntData
 * through a real render without a live Supabase project. Mission Hunt
 * never touches supabase.auth anymore — there is no personal session, so
 * this fake exposes only `.from()`. */
function buildFakeSupabaseClient(tables: {
  profiles: unknown[];
  projects: unknown[];
  team_members?: unknown[];
  placement_reviews?: unknown[];
  placement_talent_managers?: unknown[];
  talent_manager_reviews?: unknown[];
  opportunity_reviews?: unknown[];
}) {
  function from(table: 'profiles' | 'projects' | 'team_members' | 'placement_reviews' | 'placement_talent_managers' | 'talent_manager_reviews' | 'opportunity_reviews') {
    const rows = tables[table] ?? [];
    const builder = {
      select: () => builder,
      eq: (_col: string, _value: string) => builder,
      order: () => builder,
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    return builder;
  }
  return { from };
}

const PROFILES = [
  { id: 'p1', user_id: 'user-1', display_name: 'Bernard', email_normalized: 'bernard.drost@maandag.com', role: 'admin', active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p2', user_id: 'user-2', display_name: 'Lisa', email_normalized: 'lisa@maandag.com', role: 'member', active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p3', user_id: 'user-3', display_name: 'Jordan', email_normalized: 'jordan@maandag.com', role: 'manager', active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p4', user_id: 'user-4', display_name: 'Marre', email_normalized: 'marre@maandag.com', role: 'office_manager', active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p5', user_id: 'user-5', display_name: 'Maureen B', email_normalized: 'maureen.bokkers@maandag.com', role: 'hr', active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p6', user_id: 'user-6', display_name: 'Kim', email_normalized: 'kim.schuring@maandag.com', role: 'member', active: true, created_at: '2026-09-01T00:00:00Z' },
];

async function selectPerson(user: ReturnType<typeof userEvent.setup>, displayName: string) {
  await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: new RegExp(`^${displayName}$`) }));
  await user.click(screen.getByRole('button', { name: /doorgaan/i }));
}

describe('MissionHuntPage — setup required', () => {
  it('shows SETUP REQUIRED and never attempts to connect when Supabase env vars are unset', () => {
    isSupabaseConfigured.mockReturnValue(false);
    render(<MissionHuntPage />);

    expect(screen.getByText(/setup required/i)).toBeInTheDocument();
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe('MissionHuntPage — WIE BEN JIJ? gate', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: PROFILES, projects: [] }));
  });

  it('3. a first visit (nothing remembered on this device) shows WIE BEN JIJ? with the real roster, never placement data', async () => {
    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Bernard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lisa' })).toBeInTheDocument();
    expect(screen.queryByText(/voor vrijdag/i)).not.toBeInTheDocument();
  });

  it('the search field narrows the roster by name', async () => {
    const user = userEvent.setup();
    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());

    await user.type(screen.getByLabelText(/zoek je naam/i), 'lis');

    expect(screen.getByRole('button', { name: 'Lisa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bernard' })).not.toBeInTheDocument();
  });

  it('DOORGAAN is disabled until a name is picked', async () => {
    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /doorgaan/i })).toBeDisabled();
  });

  it('4. selecting a name and clicking DOORGAAN opens that person\'s dashboard, and remembers the choice on this device', async () => {
    const user = userEvent.setup();
    render(<MissionHuntPage />);

    await selectPerson(user, 'Lisa');

    await waitFor(() => expect(screen.getByText(/current agent/i)).toBeInTheDocument());
    expect(screen.getAllByText('Lisa').length).toBeGreaterThan(0);
    expect(getSelectedPersonId()).toBe('p2');
  });
});

describe('MissionHuntPage — remembered person on this device', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: PROFILES, projects: [] }));
  });

  it('5. a remembered person skips WIE BEN JIJ? entirely and opens straight into their dashboard', async () => {
    setSelectedPersonId('p2');
    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: /wie ben jij/i })).not.toBeInTheDocument();
  });

  it('a full remount (page refresh, or App.tsx unmounting Mission Hunt when navigating to Calculator and back) restores the same remembered person', async () => {
    setSelectedPersonId('p2');
    const { unmount } = render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    unmount();

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: /wie ben jij/i })).not.toBeInTheDocument();
  });

  it('6. WISSEL PERSOON returns to WIE BEN JIJ? and forgets the remembered person', async () => {
    setSelectedPersonId('p2');
    const user = userEvent.setup();
    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /wissel persoon/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());
    expect(getSelectedPersonId()).toBeNull();
  });

  it('after WISSEL PERSOON, a fresh mount requires selecting a name again — no leftover selection lets it skip straight back in', async () => {
    setSelectedPersonId('p2');
    const user = userEvent.setup();
    const { unmount } = render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /wissel persoon/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());
    unmount();

    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /wie ben jij/i })).toBeInTheDocument());
    expect(screen.queryByText(/current agent/i)).not.toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, member (AM)', () => {
  it('7. a member lands on My Placements by default, with the full tab bar also available', async () => {
    setSelectedPersonId('p2');
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: PROFILES,
        projects: [],
      }),
    );

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());
    expect(screen.getByText(/voor vrijdag/i)).toBeInTheDocument();
    // Everyone gets the tab bar now — roles only pick the default tab.
    expect(screen.getByRole('button', { name: /team placement import/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /friday review/i })).toBeInTheDocument();
  });
});

describe('MissionHuntPage — signed-in flow, admin/manager/office_manager/hr all default to Friday Review', () => {
  it.each([
    ['p1', 'Bernard'],
    ['p3', 'Jordan'],
    ['p4', 'Marre'],
    ['p5', 'Maureen B'],
  ])('%s (%s) lands on Friday Review by default and can still reach My Placements / Team Placement Import', async (personId) => {
    setSelectedPersonId(personId);
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: PROFILES, projects: [] }));
    const user = userEvent.setup();

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText(/team zwolle/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^my placements$/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^my placements$/i }));
    expect(screen.getByText(/voor vrijdag/i)).toBeInTheDocument();
  });
});

describe('MissionHuntPage — everyone may edit: no personal write restrictions', () => {
  it("8. a plain member can reassign and manage Talent Managers on a colleague's placement — no admin bypass needed", async () => {
    setSelectedPersonId('p2'); // Lisa, a plain member
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: PROFILES,
        projects: [
          {
            id: 'colleague-placement',
            owner_id: 'user-1',
            owner_email: 'bernard.drost@maandag.com',
            owner_display_name: 'Bernard',
            professional_name: 'Ryan Dijkstra',
            client_name: 'Greijdanus',
            start_date: '2026-10-01',
            end_date: '2026-12-31',
            hours_per_week: 24,
            monthly_vcdb: 10,
            note: null,
            fingerprint: 'fp-1',
            created_at: 'x',
            updated_at: 'x',
          },
        ],
      }),
    );
    const user = userEvent.setup();

    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());

    // The colleague's placement isn't in "My Placements" — reach it via
    // Friday Review's drilldown instead.
    await user.click(screen.getByRole('button', { name: /friday review/i }));
    await user.click(await screen.findByText('Bernard'));
    await user.click(await screen.findByText('Ryan Dijkstra'));

    // canReassign renders the reassignment fields; canManageTalentManagers
    // renders the Talent Manager assignment control (an "add new" field
    // with none linked yet); editable renders the delete affordance — all
    // three unconditional now, for a plain member looking at a colleague's
    // placement.
    expect(await screen.findByText(/toewijzen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mailadres \(nieuw\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verwijderen/i })).toBeInTheDocument();
  });

  it('9. Team Placement Import is reachable by a plain member, not just admin/manager/office_manager', async () => {
    setSelectedPersonId('p2');
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeSupabaseClient({ profiles: PROFILES, projects: [] }));
    const user = userEvent.setup();

    render(<MissionHuntPage />);
    await waitFor(() => expect(screen.getByText('Lisa')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /team placement import/i }));

    expect(await screen.findByRole('button', { name: /paste from excel/i })).toBeInTheDocument();
  });
});

describe('MissionHuntPage — a single AM+TM selection exposes both perspectives without duplicating team totals', () => {
  it("shows the AM's own placement in My Placements AND a colleague's TM-linked placement in My Professionals, as two distinct, non-overlapping counts", async () => {
    setSelectedPersonId('p6'); // Kim
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(
      buildFakeSupabaseClient({
        profiles: PROFILES,
        projects: [
          {
            id: 'own-1',
            owner_id: 'user-6',
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

    await waitFor(() => expect(screen.getByText('Kim Own Professional')).toBeInTheDocument());
    expect(screen.getByText('Jurgen Linked Professional')).toBeInTheDocument();
    expect(screen.getAllByText('Kim Own Professional')).toHaveLength(1);
    expect(screen.getAllByText('Jurgen Linked Professional')).toHaveLength(1);

    expect(screen.getByText(/mijn professionals/i)).toBeInTheDocument();
    expect(screen.getByText(/jurgen — 1/i)).toBeInTheDocument();
  });
});

describe('MissionHuntPage — loading and error states', () => {
  it('10. shows a "loading team roster" state, never a blank screen, while the roster fetch is pending', () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({
      from: () => ({
        select: () => ({ order: () => new Promise(() => {}) }),
      }),
    });

    render(<MissionHuntPage />);

    expect(screen.getByText(/loading team roster/i)).toBeInTheDocument();
  });

  it('a roster fetch failure shows System Error + Retry, never a crash', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({
      from: () => ({
        select: () => ({
          order: async () => {
            throw new Error('network down');
          },
        }),
      }),
    });

    render(<MissionHuntPage />);

    await waitFor(() => expect(screen.getByText('System Error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

describe('MissionHuntPage — editing a placement after ALLES KLOPT refetches and clears the confirmation', () => {
  it('the ALLES KLOPT banner disappears once the server-side trigger has invalidated it, without a full page reload', async () => {
    setSelectedPersonId('p1');
    isSupabaseConfigured.mockReturnValue(true);

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
            order: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: PROFILES, error: null }) }),
            eq: () => ({ maybeSingle: async () => ({ data: PROFILES[0], error: null }) }),
            then: (resolve: (v: unknown) => void) => resolve({ data: PROFILES, error: null }),
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
      if (table === 'opportunity_reviews') return { select: () => ({ then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }) }) };
      throw new Error(`unexpected table ${table}`);
    }

    getSupabaseClient.mockReturnValue({ from });

    render(<MissionHuntPage />);

    // Bernard (admin) defaults to Friday Review now — switch to My
    // Placements, which also happens to contain "GECONTROLEERD" text.
    await waitFor(() => expect(screen.getByRole('button', { name: /^my placements$/i })).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole('button', { name: /^my placements$/i }));

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
