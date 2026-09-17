-- Product decision: Mission Hunt is an internal salesgame for a trusted
-- team, not a system that needs to tell people apart for security. Personal
-- Supabase Auth (magic link, then email OTP) is removed from the frontend
-- entirely — nobody ever calls supabase.auth.signInWithOtp/verifyOtp again,
-- so every Mission Hunt request from now on runs as the anon role (the
-- publishable key), never as `authenticated`. Every policy below that used
-- to check `auth.uid()`/`auth.email()` would otherwise silently start
-- denying everyone, forever, the instant this ships — that is the bug this
-- migration exists to prevent, not a security tightening.
--
-- The product owner has explicitly accepted, for this specific internal
-- tool, behind the app's existing Zwolle access gate:
--   - the outer gate is not strong authentication
--   - a team member can select another person's name and inspect/edit
--     their data
--   - team members can edit each other's placement data
-- Roles (admin/manager/office_manager/hr, and the AM/TM tags in
-- team_member_roles) remain in the schema for UX only now (default landing
-- view) — they are no longer an authorization boundary anywhere.
--
-- auth.users itself, and every existing row in it, is untouched — profiles
-- still reference real auth.users rows (their FKs still resolve), this
-- migration only stops requiring a live authenticated session to reach
-- them. Nothing here exposes the service_role/secret key: the frontend
-- still only ever holds the publishable key, and every policy below is
-- scoped to `anon, authenticated` — never `service_role` (which bypasses
-- RLS by default regardless of any policy).

-- ---------------------------------------------------------------------------
-- profiles: read-only from the client either way (the client never writes
-- this table) — just needs to be readable without a session, for the "WIE
-- BEN JIJ?" roster picker and every screen that shows a name.
-- ---------------------------------------------------------------------------

drop policy if exists "profiles are readable by any authenticated user" on public.profiles;
drop policy if exists "an admin may update any profile" on public.profiles;

create policy "profiles are readable by the trusted team"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- team_members / team_member_roles: read-only roster overlays, same reasoning.
-- ---------------------------------------------------------------------------

drop policy if exists "team_members are readable by any authenticated user" on public.team_members;
drop policy if exists "an admin may manage team_members" on public.team_members;

create policy "team_members are readable by the trusted team"
  on public.team_members for select
  to anon, authenticated
  using (true);

drop policy if exists "team_member_roles are readable by any authenticated user" on public.team_member_roles;
drop policy if exists "an admin may manage team_member_roles" on public.team_member_roles;

create policy "team_member_roles are readable by the trusted team"
  on public.team_member_roles for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- projects (placements): every selected team member may view, add, edit,
-- delete, and reassign ownership on every placement — no ownership check,
-- no role check.
-- ---------------------------------------------------------------------------

drop policy if exists "projects are readable by any authenticated user" on public.projects;
drop policy if exists "a user may insert their own projects" on public.projects;
drop policy if exists "a user may update their own projects" on public.projects;
drop policy if exists "a user may delete their own projects" on public.projects;
drop policy if exists "a full-access role may insert any project" on public.projects;
drop policy if exists "a full-access role may update any project" on public.projects;
drop policy if exists "a full-access role may delete any project" on public.projects;

create policy "the trusted team may fully manage projects"
  on public.projects for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- placement_talent_managers: any team member may view and change Talent
-- Manager assignments on any placement.
-- ---------------------------------------------------------------------------

drop policy if exists "placement_talent_managers are readable by any authenticated user" on public.placement_talent_managers;
drop policy if exists "an admin may manage placement_talent_managers" on public.placement_talent_managers;
drop policy if exists "a full-access role may manage placement_talent_managers" on public.placement_talent_managers;

create policy "the trusted team may fully manage placement_talent_managers"
  on public.placement_talent_managers for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- placement_reviews ("ALLES KLOPT") / talent_manager_reviews ("TM CHECK"):
-- the app still upserts by the currently selected person's user_id (see
-- useMissionHuntData.ts) — RLS itself no longer restricts who may write
-- which row, matching the accepted trust model.
-- ---------------------------------------------------------------------------

drop policy if exists "placement_reviews are readable by any authenticated user" on public.placement_reviews;
drop policy if exists "a user may upsert their own placement_review" on public.placement_reviews;
drop policy if exists "a user may update their own placement_review" on public.placement_reviews;
drop policy if exists "a user may delete their own placement_review" on public.placement_reviews;

create policy "the trusted team may fully manage placement_reviews"
  on public.placement_reviews for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "talent_manager_reviews are readable by any authenticated user" on public.talent_manager_reviews;
drop policy if exists "a user may upsert their own talent_manager_review" on public.talent_manager_reviews;
drop policy if exists "a user may update their own talent_manager_review" on public.talent_manager_reviews;
drop policy if exists "a user may delete their own talent_manager_review" on public.talent_manager_reviews;

create policy "the trusted team may fully manage talent_manager_reviews"
  on public.talent_manager_reviews for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- league_check_receipts: League Check Intelligence keeps working, now
-- attributed to whichever team member is currently selected (created_by is
-- still a real auth.users id — the selected profile's user_id — just no
-- longer required to match a live session's auth.uid(), since there isn't
-- one). The 0004 "own row" SELECT policy is superseded: it existed only so
-- INSERT ... ON CONFLICT DO UPDATE could see the conflicting row under
-- auth.uid(), which no longer applies. get_league_check_stats() remains the
-- only path for team-wide aggregate reads (unchanged, already anon-
-- executable) — this table's raw-row SELECT stays scoped to "your own
-- upsert can see its own row", now keyed on created_by instead of auth.uid().
-- ---------------------------------------------------------------------------

drop policy if exists "an authenticated user may see their own receipt" on public.league_check_receipts;
drop policy if exists "an authenticated user may insert their own receipt" on public.league_check_receipts;
drop policy if exists "an authenticated user may update their own receipt" on public.league_check_receipts;

create policy "the trusted team may register league_check_receipts"
  on public.league_check_receipts for all
  to anon, authenticated
  using (true)
  with check (true);
