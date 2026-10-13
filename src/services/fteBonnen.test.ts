import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFteBon, deleteFteBon, fetchFteBonnen, mapFteBonRow, sumOpenFte, updateFteBonStatus, type FteBon } from './fteBonnen';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

function bon(overrides: Partial<FteBon>): FteBon {
  return { id: 'x', label: 'X', type: 'VERLENGING', fteDelta: 0, owner: null, note: null, status: 'open', createdAt: '2026-10-13T08:00:00Z', ...overrides };
}

describe('sumOpenFte', () => {
  it('adds only open bonnen, rounded to 2 decimals', () => {
    expect(sumOpenFte([bon({ fteDelta: 0.8 }), bon({ fteDelta: 0.6 }), bon({ fteDelta: 1, status: 'gerealiseerd' })])).toBe(1.4);
    expect(sumOpenFte([bon({ fteDelta: 0.1 }), bon({ fteDelta: 0.2 })])).toBe(0.3);
  });

  it('negative bonnen count against the total', () => {
    expect(sumOpenFte([bon({ fteDelta: 1 }), bon({ fteDelta: -0.4 })])).toBe(0.6);
  });

  it('no bonnen: 0', () => {
    expect(sumOpenFte([])).toBe(0);
  });
});

describe('mapFteBonRow', () => {
  it('maps a database row, turning a numeric string into a number', () => {
    expect(
      mapFteBonRow({ id: 'a', label: 'JdV', action_type: 'PO_NAAR_CONTRACT', fte_delta: '0.80', owner: 'BD', note: null, status: 'open', created_at: 't' }),
    ).toEqual({ id: 'a', label: 'JdV', type: 'PO_NAAR_CONTRACT', fteDelta: 0.8, owner: 'BD', note: null, status: 'open', createdAt: 't' });
  });
});

describe('Supabase calls never throw', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReset();
    getSupabaseClient.mockReset();
  });

  it('not configured: fetch is null, writes report failure, the client is never touched', async () => {
    isSupabaseConfigured.mockReturnValue(false);
    expect(await fetchFteBonnen()).toBeNull();
    expect(await createFteBon({ label: 'A', type: 'VERLENGING', fteDelta: 1 })).toBeNull();
    expect(await updateFteBonStatus('a', 'gerealiseerd')).toBe(false);
    expect(await deleteFteBon('a')).toBe(false);
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('a throwing client: fetch resolves null', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockImplementation(() => {
      throw new Error('Invalid URL');
    });
    expect(await fetchFteBonnen()).toBeNull();
  });

  it('create trims text, blanks optional fields to null, rounds FTE', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: 'n', label: 'JdV', action_type: 'VERLENGING', fte_delta: 0.33, owner: null, note: null, status: 'open', created_at: 't' },
          error: null,
        }),
      }),
    });
    getSupabaseClient.mockReturnValue({ from: () => ({ insert }) });

    const created = await createFteBon({ label: '  JdV ', type: 'VERLENGING', fteDelta: 0.333, owner: '  ', note: '' });

    expect(insert).toHaveBeenCalledWith({ label: 'JdV', action_type: 'VERLENGING', fte_delta: 0.33, owner: null, note: null });
    expect(created?.id).toBe('n');
  });
});
