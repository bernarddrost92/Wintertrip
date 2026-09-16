import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  computeLeagueCheckReceiptStats,
  fetchLeagueCheckReceiptStats,
  upsertLeagueCheckReceipt,
  type LeagueCheckReceiptRow,
} from './leagueCheckReceipts';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

function row(checkedCount: number, totalChecks = 6): LeagueCheckReceiptRow {
  return { checked_count: checkedCount, total_checks: totalChecks };
}

describe('computeLeagueCheckReceiptStats — pure aggregation, never a league score', () => {
  it('0 receipts: everything zero, 0% checked, no division-by-zero (not NaN/Infinity)', () => {
    const stats = computeLeagueCheckReceiptStats([]);
    expect(stats).toEqual({
      totalReceipts: 0,
      completedChecks: 0,
      maxChecks: 0,
      approvedCount: 0,
      openCount: 0,
      openChecks: 0,
      completionPercentage: 0,
    });
    expect(Number.isNaN(stats.completionPercentage)).toBe(false);
    expect(Number.isFinite(stats.completionPercentage)).toBe(true);
  });

  it('1 receipt at 6/6: fully approved, 0 open, 100% checked', () => {
    const stats = computeLeagueCheckReceiptStats([row(6)]);
    expect(stats.totalReceipts).toBe(1);
    expect(stats.completedChecks).toBe(6);
    expect(stats.maxChecks).toBe(6);
    expect(stats.approvedCount).toBe(1);
    expect(stats.openCount).toBe(0);
    expect(stats.openChecks).toBe(0);
    expect(stats.completionPercentage).toBe(100);
  });

  it('1 receipt at 3/6: open, not approved, exactly half checked', () => {
    const stats = computeLeagueCheckReceiptStats([row(3)]);
    expect(stats.totalReceipts).toBe(1);
    expect(stats.completedChecks).toBe(3);
    expect(stats.maxChecks).toBe(6);
    expect(stats.approvedCount).toBe(0);
    expect(stats.openCount).toBe(1);
    expect(stats.openChecks).toBe(3);
    expect(stats.completionPercentage).toBe(50);
  });

  it('a receipt with 0/6 checked still counts as one receipt and one open receipt', () => {
    const stats = computeLeagueCheckReceiptStats([row(0)]);
    expect(stats.totalReceipts).toBe(1);
    expect(stats.completedChecks).toBe(0);
    expect(stats.approvedCount).toBe(0);
    expect(stats.openCount).toBe(1);
  });

  it('the worked example from spec: 9 receipts, 47/54 checks, 87% checked', () => {
    // 8 receipts at 6/6 (48 checks) would overshoot 47, so mix them: 7 at 6/6
    // (42) + one at 5/6 (5) = 47/54 across 8 receipts — adjusted to 9
    // receipts by adding one more at 0/6 so totals still land on 47/54.
    const rows = [...Array(7).fill(row(6)), row(5), row(0)];
    const stats = computeLeagueCheckReceiptStats(rows);
    expect(stats.totalReceipts).toBe(9);
    expect(stats.completedChecks).toBe(47);
    expect(stats.maxChecks).toBe(54);
    expect(stats.approvedCount).toBe(7);
    expect(stats.openCount).toBe(2);
    expect(stats.openChecks).toBe(7);
    expect(stats.completionPercentage).toBe(87);
  });

  it('multiple receipts: approved and open counts add up to total receipts', () => {
    const rows = [row(6), row(6), row(4), row(2), row(0)];
    const stats = computeLeagueCheckReceiptStats(rows);
    expect(stats.totalReceipts).toBe(5);
    expect(stats.approvedCount).toBe(2);
    expect(stats.openCount).toBe(3);
    expect(stats.approvedCount + stats.openCount).toBe(stats.totalReceipts);
  });

  it('completionPercentage rounds to a whole percent', () => {
    // 1/3 -> 33.33...% rounds to 33.
    const stats = computeLeagueCheckReceiptStats([row(1, 3)]);
    expect(stats.completionPercentage).toBe(33);
  });
});

describe('fetchLeagueCheckReceiptStats — returns null instead of throwing when unavailable', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReset();
    getSupabaseClient.mockReset();
  });

  it('Supabase not configured: returns null, never calls getSupabaseClient', async () => {
    isSupabaseConfigured.mockReturnValue(false);
    const result = await fetchLeagueCheckReceiptStats();
    expect(result).toBeNull();
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('an RPC error: returns null rather than throwing', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({
      rpc: () => ({ single: async () => ({ data: null, error: new Error('boom') }) }),
    });
    const result = await fetchLeagueCheckReceiptStats();
    expect(result).toBeNull();
  });

  it('a successful RPC call: maps the aggregate row, never fetches raw rows', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const rpc = vi.fn().mockReturnValue({
      single: async () => ({
        data: { receipt_count: 2, completed_checks: 9, max_checks: 12, approved_count: 1, open_count: 1, completion_percentage: 75 },
        error: null,
      }),
    });
    getSupabaseClient.mockReturnValue({ rpc });
    const result = await fetchLeagueCheckReceiptStats();
    expect(rpc).toHaveBeenCalledWith('get_league_check_stats');
    expect(result).toEqual({
      totalReceipts: 2,
      completedChecks: 9,
      maxChecks: 12,
      approvedCount: 1,
      openCount: 1,
      openChecks: 3,
      completionPercentage: 75,
    });
  });
});

describe('upsertLeagueCheckReceipt — never throws, reports success as a boolean', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReset();
    getSupabaseClient.mockReset();
  });

  it('Supabase not configured: resolves false without calling getSupabaseClient', async () => {
    isSupabaseConfigured.mockReturnValue(false);
    const ok = await upsertLeagueCheckReceipt({ id: 'r1', checkedCount: 3, totalChecks: 6, userId: 'u1' });
    expect(ok).toBe(false);
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('a failed upsert: resolves false', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const upsert = vi.fn().mockResolvedValue({ error: new Error('rejected by RLS') });
    getSupabaseClient.mockReturnValue({ from: () => ({ upsert }) });
    const ok = await upsertLeagueCheckReceipt({ id: 'r1', checkedCount: 3, totalChecks: 6, userId: 'u1' });
    expect(ok).toBe(false);
  });

  it('a successful upsert: resolves true and sends the right row shape', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    getSupabaseClient.mockReturnValue({ from: () => ({ upsert }) });
    const ok = await upsertLeagueCheckReceipt({ id: 'r1', checkedCount: 3, totalChecks: 6, userId: 'u1' });
    expect(ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith({ id: 'r1', checked_count: 3, total_checks: 6, created_by: 'u1' });
  });
});
