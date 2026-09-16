-- Mission Hunt: extend the role model with three new OPERATIONAL/READ
-- staff roles (manager, office_manager, hr) alongside the existing
-- member/admin. AM/TM identity remains entirely data-driven (unchanged) —
-- these are coarse, single-valued account roles like admin, never a
-- replacement for the AM/TM concept.
--
-- manager & office_manager get the SAME operational write scope admin has
-- over placements/import/TM-assignments (never over roles/security — the
-- only RLS surface that grants role changes, public.profiles' UPDATE
-- policy and team_member_roles'/team_members' write policies, stays
-- admin-only, completely untouched by this migration — which is what
-- makes "cannot alter security roles" / "cannot promote themselves to
-- admin" hold structurally rather than by convention).
--
-- hr gets literally zero new grants: every relevant table is already
-- open-read to any authenticated user (profiles/projects/
-- placement_talent_managers/placement_reviews/talent_manager_reviews), and
-- hr owns no placements and isn't part of any broadened write policy, so
-- every write path still falls through to "denied" for them.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'admin', 'manager', 'office_manager', 'hr'));

-- Broaden the three admin-only projects policies to the three
-- full-access roles — same USING/WITH CHECK shape as before (both
-- populated identically, per the privilege-escalation lesson from
-- migration 0006), just a wider role set in the EXISTS check.
drop policy if exists "an admin may insert any project" on public.projects;
create policy "a full-access role may insert any project"
  on public.projects for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')));

drop policy if exists "an admin may update any project" on public.projects;
create policy "a full-access role may update any project"
  on public.projects for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')));

drop policy if exists "an admin may delete any project" on public.projects;
create policy "a full-access role may delete any project"
  on public.projects for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')));

-- Same broadening for placement_talent_managers (TM assignment writes).
drop policy if exists "an admin may manage placement_talent_managers" on public.placement_talent_managers;
create policy "a full-access role may manage placement_talent_managers"
  on public.placement_talent_managers for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin', 'manager', 'office_manager')));

-- profiles' write policy, team_member_roles' write policy, and
-- team_members' write policy are deliberately left untouched — still
-- literally role = 'admin' — this is the entire enforcement of "manager/
-- office_manager cannot alter security roles or grant themselves admin".
