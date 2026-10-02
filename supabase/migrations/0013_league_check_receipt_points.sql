-- League Check receipts now also record the points each receipt printed, so
-- Mission Control can show how many receipts Team Zwolle generated and the
-- points they add up to (replacing the no-longer-maintained Marre
-- production feed there).
--
-- found_points  — the receipt's "Gevonden Winst" (found league points:
--                 After Check minus Before Check, can be negative).
-- mission_value — the receipt's After Check "Mission Value".
--
-- Both are 0 for a standalone League Check (no Calculator session, so no
-- score was ever printed) and for every receipt registered before this
-- migration: those rows never stored points, so they still count as
-- receipts but contribute nothing to the totals — never a back-filled guess.
--
-- Applied to the live project as two migrations:
-- league_check_receipt_points_columns and league_check_points_stats_rpc.

alter table public.league_check_receipts
  add column if not exists found_points numeric(14, 4) not null default 0,
  add column if not exists mission_value numeric(14, 4) not null default 0;

-- A new aggregate RPC alongside get_league_check_stats() rather than a
-- replacement: changing that function's return type would mean dropping
-- it, and the currently deployed frontend still calls it until the new one
-- ships. Same SECURITY DEFINER / pinned search_path / authenticated-only
-- EXECUTE as migration 0010 left the original. get_league_check_stats()
-- is now unused by the frontend and can be dropped in a later migration.
create or replace function public.get_league_check_points_stats()
returns table (
  receipt_count integer,
  completed_checks integer,
  max_checks integer,
  approved_count integer,
  open_count integer,
  completion_percentage integer,
  total_found_points numeric,
  total_mission_value numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*)::integer,
    coalesce(sum(checked_count), 0)::integer,
    coalesce(sum(total_checks), 0)::integer,
    (count(*) filter (where checked_count = total_checks))::integer,
    (count(*) filter (where checked_count <> total_checks))::integer,
    case when coalesce(sum(total_checks), 0) = 0 then 0
         else round(sum(checked_count)::numeric / sum(total_checks)::numeric * 100)::integer end,
    coalesce(sum(found_points), 0),
    coalesce(sum(mission_value), 0)
  from public.league_check_receipts;
$$;

revoke all on function public.get_league_check_points_stats() from public;
revoke execute on function public.get_league_check_points_stats() from anon;
grant execute on function public.get_league_check_points_stats() to authenticated;
