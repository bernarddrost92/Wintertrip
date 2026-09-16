-- Forward-only sync migration: codifies two pieces of drift between the
-- live production database (source of truth) and the repo's migration
-- history, so a fresh database + repo migrations reaches the same safe end
-- state as production.
--
-- 1. profiles: the original "a user may update their own profile" policy
--    from 0001_mission_hunt.sql was deliberately removed live — a member
--    must never be able to promote themselves to admin by editing their own
--    row. Only an admin may update any profile now. This statement is a
--    no-op on production (already true) and brings a fresh database in
--    line with it.
-- 2. league_check_receipts: replaces the public raw-row SELECT policy with
--    a SECURITY DEFINER aggregate RPC. The Calculator only ever needed
--    totals (receipt_count, completed_checks, max_checks, approved_count,
--    open_count, completion_percentage) — it never needed row-level access
--    to created_by/id/timestamps. Raw SELECT is no longer public (or
--    granted to any role at all); only the aggregate function is.

drop policy if exists "a user may update their own profile" on public.profiles;

drop policy if exists "league check receipt counts are readable by anyone" on public.league_check_receipts;

-- Same trigger function as 0001/0002, hardened with an explicit search_path
-- (addresses the Supabase security advisor's function_search_path_mutable
-- warning) — identical behavior, no functional change for either trigger
-- that uses it (projects.updated_at, league_check_receipts.updated_at).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Returns only aggregate totals, never a raw row — no created_by, no id, no
-- timestamps. SECURITY DEFINER so it can aggregate across every user's
-- receipts despite RLS denying direct table access; search_path is pinned
-- explicitly (never mutable) and it grants execute to exactly anon and
-- authenticated, nothing broader.
create or replace function public.get_league_check_stats()
returns table (
  receipt_count integer,
  completed_checks integer,
  max_checks integer,
  approved_count integer,
  open_count integer,
  completion_percentage integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*)::integer as receipt_count,
    coalesce(sum(checked_count), 0)::integer as completed_checks,
    coalesce(sum(total_checks), 0)::integer as max_checks,
    count(*) filter (where checked_count = total_checks)::integer as approved_count,
    count(*) filter (where checked_count <> total_checks)::integer as open_count,
    case
      when coalesce(sum(total_checks), 0) = 0 then 0
      else round(sum(checked_count)::numeric / sum(total_checks)::numeric * 100)::integer
    end as completion_percentage
  from public.league_check_receipts;
$$;

revoke all on function public.get_league_check_stats() from public;
grant execute on function public.get_league_check_stats() to anon, authenticated;
