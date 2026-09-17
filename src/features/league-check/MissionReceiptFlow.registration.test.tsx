import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MissionReceiptFlow } from './MissionReceiptFlow';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import type { AgentIdentity } from '../missionFlow/missionFlowContext';

const { isSupabaseConfigured, getSupabaseClient, getSelectedPersonId, mockUserIdForPerson, upsert } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
  getSelectedPersonId: vi.fn(),
  mockUserIdForPerson: { current: null as string | null },
  upsert: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));
vi.mock('../mission-hunt/personStorage', () => ({ getSelectedPersonId }));

function buildFakeClient() {
  return {
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => (mockUserIdForPerson.current ? { data: { user_id: mockUserIdForPerson.current }, error: null } : { data: null, error: null }),
            }),
          }),
        };
      }
      return { upsert: upsert.mockResolvedValue({ error: null }) };
    },
  };
}

const AGENT: AgentIdentity = { agentName: 'Bernard', agentRole: 'AM', professionalName: 'Tim Jansen' };
const THREE_OF_SIX: Record<string, boolean> = Object.fromEntries(LEAGUE_CHECK_ITEMS.slice(0, 3).map((item) => [item.id, true]));

function clickGenerate() {
  fireEvent.click(screen.getByRole('button', { name: /generate receipt|view receipt/i }));
}

describe('MissionReceiptFlow — League Check Intelligence registration on Generate Receipt', () => {
  beforeEach(() => {
    upsert.mockClear();
    getSupabaseClient.mockClear();
    isSupabaseConfigured.mockReset();
    getSelectedPersonId.mockReset();
    mockUserIdForPerson.current = null;
  });

  it('Supabase unconfigured: receipt still generates, no write is attempted, a not-registered note is shown', async () => {
    isSupabaseConfigured.mockReturnValue(false);
    getSelectedPersonId.mockReturnValue('profile-a');
    render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-a" />,
    );
    clickGenerate();

    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(getSupabaseClient).not.toHaveBeenCalled();
    expect(await screen.findByText(/nog geen naam gekozen/i)).toBeInTheDocument();
  });

  it('no name selected yet on this device (configured, but personStorage is empty): no write is attempted, note is shown', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeClient());
    getSelectedPersonId.mockReturnValue(null);

    render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-b" />,
    );
    await screen.findByRole('button', { name: /generate receipt/i });
    clickGenerate();

    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/nog geen naam gekozen/i)).toBeInTheDocument());
    expect(upsert).not.toHaveBeenCalled();
  });

  it('a name is selected: Generate Receipt upserts the receipt with the session receiptId, checked count and total, no note is shown', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeClient());
    getSelectedPersonId.mockReturnValue('profile-123');
    mockUserIdForPerson.current = 'user-123';

    render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-c" />,
    );
    await screen.findByRole('button', { name: /generate receipt/i });
    clickGenerate();

    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    await waitFor(() =>
      expect(upsert).toHaveBeenCalledWith({ id: 'session-c', checked_count: 3, total_checks: 6, created_by: 'user-123' }),
    );
    expect(screen.queryByText(/nog geen naam gekozen/i)).not.toBeInTheDocument();
  });

  it('a name is selected, re-generating after checking another box upserts the same receiptId again (update, not a new receipt)', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue(buildFakeClient());
    getSelectedPersonId.mockReturnValue('profile-123');
    mockUserIdForPerson.current = 'user-123';

    const { rerender } = render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-d" />,
    );
    await screen.findByRole('button', { name: /generate receipt/i });
    clickGenerate();
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));

    const FOUR_OF_SIX = { ...THREE_OF_SIX, [LEAGUE_CHECK_ITEMS[3].id]: true };
    rerender(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={FOUR_OF_SIX} checkedCount={4} total={6} receiptId="session-d" />,
    );
    clickGenerate();

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(2));
    expect(upsert).toHaveBeenLastCalledWith({ id: 'session-d', checked_count: 4, total_checks: 6, created_by: 'user-123' });
  });

  it('resilience: getSupabaseClient() throws synchronously (the production incident) — League Check still renders and the receipt still generates', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSelectedPersonId.mockReturnValue('profile-e');
    getSupabaseClient.mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-e" />,
    );
    await screen.findByRole('button', { name: /generate receipt/i });
    clickGenerate();

    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(await screen.findByText(/nog geen naam gekozen/i)).toBeInTheDocument();
  });

  it('resilience: the upsert itself rejects while a name is selected — receipt generation still succeeds, failure is silent to the user', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSelectedPersonId.mockReturnValue('profile-123');
    mockUserIdForPerson.current = 'user-123';
    getSupabaseClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'profiles') {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: 'user-123' }, error: null }) }) }) };
        }
        return { upsert: vi.fn().mockRejectedValue(new Error('network down')) };
      },
    });

    render(
      <MissionReceiptFlow beforeCheck={null} agent={AGENT} checkedItems={THREE_OF_SIX} checkedCount={3} total={6} receiptId="session-f" />,
    );
    await screen.findByRole('button', { name: /generate receipt/i });
    clickGenerate();

    expect(screen.getByText('Mission Receipt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download receipt/i })).toBeEnabled();
  });
});
