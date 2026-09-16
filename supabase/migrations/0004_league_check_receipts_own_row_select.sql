-- Bugfix found by direct testing: 0003 removed the public raw-row SELECT
-- policy entirely (routing all reads through get_league_check_stats()
-- instead), but Postgres RLS requires SOME select-policy visibility into a
-- potentially-conflicting row for INSERT ... ON CONFLICT DO UPDATE to work
-- at all — the exact statement shape supabase-js's .upsert() sends. With no
-- SELECT policy at all, every single "Generate Receipt" write failed with
-- a row-level security violation, regardless of the Prefer:return=minimal
-- header (that only controls the response body, not what Postgres needs
-- internally to evaluate ON CONFLICT).
--
-- Fix: grant each authenticated user SELECT on their own row only — not
-- public, not other users' rows, just enough visibility for their own
-- upsert to work. get_league_check_stats() remains the only way to read
-- aggregate totals across everyone's receipts.
create policy "an authenticated user may see their own receipt"
  on public.league_check_receipts for select
  to authenticated
  using (created_by = auth.uid());
