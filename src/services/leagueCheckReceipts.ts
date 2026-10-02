/**
 * League Check Intelligence — a pure quality/control indicator, never a
 * league score. Writes go straight to the league_check_receipts table;
 * reads go through the get_league_check_points_stats() aggregate RPC (see
 * supabase/migrations/0003_league_check_stats_rpc_and_profile_hardening.sql
 * and 0013_league_check_receipt_points.sql)
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
  /** 0 for receipts registered before points were recorded (migration
   * 0013) and for standalone League Checks with no Calculator score. */
  found_points?: number;
  mission_value?: number;
}

/** Shape returned by the get_league_check_points_stats() RPC — aggregate totals
 * only, never created_by/id/timestamps. */
interface LeagueCheckStatsRpcRow {
  receipt_count: number;
  completed_checks: number;
  max_checks: number;
  approved_count: number;
  open_count: number;
  completion_percentage: number;
  /** Postgres numeric — PostgREST may serialize it as a string. */
  total_found_points: number | string;
  total_mission_value: number | string;
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
  /** Sum of every receipt's "Gevonden Winst" (found league points). */
  totalFoundPoints: number;
  /** Sum of every receipt's After Check "Mission Value". */
  totalMissionValue: number;
}

function toFiniteNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
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
  const totalFoundPoints = rows.reduce((sum, row) => sum + (row.found_points ?? 0), 0);
  const totalMissionValue = rows.reduce((sum, row) => sum + (row.mission_value ?? 0), 0);

  return {
    totalReceipts,
    completedChecks,
    maxChecks,
    approvedCount,
    openCount,
    openChecks,
    completionPercentage,
    totalFoundPoints,
    totalMissionValue,
  };
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
    totalFoundPoints: toFiniteNumber(row.total_found_points),
    totalMissionValue: toFiniteNumber(row.total_mission_value),
  };
}

/**
 * Team-wide read via the get_league_check_points_stats() RPC — deliberately
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
    const { data, error } = await supabase.rpc('get_league_check_points_stats').single<LeagueCheckStatsRpcRow>();
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
 * same row rather than counting as a second receipt. foundPoints and
 * missionValue are exactly what the receipt printed ("Gevonden Winst" and
 * the After Check "Mission Value"), 0 when it printed no score. Requires a signed-in
 * userId: there is no anon write policy, by design (see the migration).
 */
export async function upsertLeagueCheckReceipt(params: {
  id: string;
  checkedCount: number;
  totalChecks: number;
  userId: string;
  foundPoints: number;
  missionValue: number;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('league_check_receipts').upsert({
      id: params.id,
      checked_count: params.checkedCount,
      total_checks: params.totalChecks,
      created_by: params.userId,
      found_points: toFiniteNumber(params.foundPoints),
      mission_value: toFiniteNumber(params.missionValue),
    });
    return !error;
  } catch {
    return false;
  }
}
