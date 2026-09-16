/**
 * League Check Intelligence — a pure quality/control indicator, never a
 * league score. Reads/writes the league_check_receipts table (see
 * supabase/migrations/0002_league_check_receipts.sql), the single source of
 * truth: no second local counter, no mock data.
 */
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { LEAGUE_CHECK_ITEMS } from '../data/leagueCheckItems';

export const TOTAL_CHECKS_PER_RECEIPT = LEAGUE_CHECK_ITEMS.length;

export interface LeagueCheckReceiptRow {
  checked_count: number;
  total_checks: number;
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

/**
 * Team-wide read — deliberately allowed without a signed-in Supabase user
 * (see the migration's public SELECT policy): the Calculator's compact
 * strip must work for every visitor, not only Mission Hunt-authenticated
 * ones. Returns null when Supabase isn't configured or the read fails, so
 * the caller can render an "unavailable" state instead of a fabricated one.
 */
export async function fetchLeagueCheckReceiptStats(): Promise<LeagueCheckReceiptStats | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('league_check_receipts').select('checked_count, total_checks');
    if (error || !data) return null;
    return computeLeagueCheckReceiptStats(data as LeagueCheckReceiptRow[]);
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
