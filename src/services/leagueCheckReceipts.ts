/**
 * League Check Intelligence — a pure quality/control indicator, never a
 * league score. Writes go straight to the league_check_receipts table;
 * reads go through the get_league_check_stats() aggregate RPC (see
 * supabase/migrations/0003_league_check_stats_rpc_and_profile_hardening.sql)
 * — the table's raw rows have no SELECT policy at all, so this RPC is the
 * only read path, and it is the single source of truth: no second local
 * counter, no mock data.
 */
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { LEAGUE_CHECK_ITEMS } from '../data/leagueCheckItems';

export const TOTAL_CHECKS_PER_RECEIPT = LEAGUE_CHECK_ITEMS.length;

export interface LeagueCheckReceiptRow {
  checked_count: number;
  total_checks: number;
}

/** Shape returned by the get_league_check_stats() RPC — aggregate totals
 * only, never created_by/id/timestamps. */
interface LeagueCheckStatsRpcRow {
  receipt_count: number;
  completed_checks: number;
  max_checks: number;
  approved_count: number;
  open_count: number;
  completion_percentage: number;
}

export interface LeagueCheckReceiptStats {
  totalReceipts: number;
  completedChecks: number;
  maxChecks: number;
  approvedCount: number;
  openCount: number;
  openChecks: number;
  /** Rounded whole percent — 0 when maxChecks is 0, never NaN/Infinity. */
  completionPercentage: number;
}

/**
 * Pure aggregation, no Supabase dependency — a receipt is APPROVED at
 * exactly checked_count === total_checks, OPEN otherwise (0 through
 * total_checks - 1), matching the definitions in the spec.
 */
export function computeLeagueCheckReceiptStats(rows: LeagueCheckReceiptRow[]): LeagueCheckReceiptStats {
  const totalReceipts = rows.length;
  const completedChecks = rows.reduce((sum, row) => sum + row.checked_count, 0);
  const maxChecks = rows.reduce((sum, row) => sum + row.total_checks, 0);
  const approvedCount = rows.filter((row) => row.checked_count === row.total_checks).length;
  const openCount = totalReceipts - approvedCount;
  const openChecks = maxChecks - completedChecks;
  const completionPercentage = maxChecks === 0 ? 0 : Math.round((completedChecks / maxChecks) * 100);

  return { totalReceipts, completedChecks, maxChecks, approvedCount, openCount, openChecks, completionPercentage };
}

function mapRpcRowToStats(row: LeagueCheckStatsRpcRow): LeagueCheckReceiptStats {
  return {
    totalReceipts: row.receipt_count,
    completedChecks: row.completed_checks,
    maxChecks: row.max_checks,
    approvedCount: row.approved_count,
    openCount: row.open_count,
    openChecks: row.max_checks - row.completed_checks,
    completionPercentage: row.completion_percentage,
  };
}

/**
 * Team-wide read via the get_league_check_stats() RPC — deliberately
 * grant-executable without a signed-in Supabase user (see the migration):
 * the Calculator's compact strip must work for every visitor, not only
 * Mission Hunt-authenticated ones. The RPC returns aggregates only, never
 * raw rows. Returns null when Supabase isn't configured or the call fails,
 * so the caller can render an "unavailable" state instead of a fabricated
 * one.
 */
export async function fetchLeagueCheckReceiptStats(): Promise<LeagueCheckReceiptStats | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_league_check_stats').single<LeagueCheckStatsRpcRow>();
    if (error || !data) return null;
    return mapRpcRowToStats(data);
  } catch {
    return null;
  }
}

/**
 * Registers (or re-registers) one League Check receipt. `id` is the stable
 * per-session receipt id from useLeagueCheck — upserting on it means
 * clicking Generate Receipt again after checking one more box updates the
 * same row rather than counting as a second receipt. Requires a signed-in
 * userId: there is no anon write policy, by design (see the migration).
 */
export async function upsertLeagueCheckReceipt(params: {
  id: string;
  checkedCount: number;
  totalChecks: number;
  userId: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('league_check_receipts').upsert({
      id: params.id,
      checked_count: params.checkedCount,
      total_checks: params.totalChecks,
      created_by: params.userId,
    });
    return !error;
  } catch {
    return false;
  }
}
