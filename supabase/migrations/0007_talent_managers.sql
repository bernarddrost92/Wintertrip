-- Mission Hunt: extend the working AM-ownership architecture with a
-- many-to-many Talent Manager relation. ONE placement stays ONE row in
-- public.projects (AM ownership on that table is untouched) — a TM is
-- attached via a separate join table, never by duplicating the placement.
-- Forward-only: no existing table is dropped or recreated, and
-- projects/profiles/team_members/placement_reviews keep working exactly
-- as before (verified live before this migration was written).

-- ---------------------------------------------------------------------------
-- placement_talent_managers: the many-to-many AM-placement <-> TM relation.
-- Email is the durable key here too — same principle as AM ownership — so a
-- TM can be linked before they have ever logged in.
-- ---------------------------------------------------------------------------

create table if not exists public.placement_talent_managers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  talent_manager_email text not null,
  talent_manager_id uuid references auth.users(id) on delete set null,
  talent_manager_display_name text,
  created_at timestamptz not null default now()
);

-- Case/whitespace-insensitive uniqueness — the same placement can only be
-- linked to a given person once, however their email was typed.
create unique index if not exists placement_talent_managers_unique_link
  on public.placement_talent_managers (project_id, public.normalize_email(talent_manager_email));

create index if not exists placement_talent_managers_email_idx
  on public.placement_talent_managers (public.normalize_email(talent_manager_email));

alter table public.placement_talent_managers enable row level security;

-- Read is open to any authenticated team member — same "anyone can see the
-- team's opportunity structure" principle already used for profiles/projects
-- (Friday Review, cross-team drilldowns). Only ADMIN may write: a TM can
-- never attach themselves to a placement or attach another TM, and an AM
-- can never arbitrarily attach/remove a TM on their own placement.
create policy "placement_talent_managers are readable by any authenticated user"
  on public.placement_talent_managers for select
  to authenticated
  using (true);

create policy "an admin may manage placement_talent_managers"
  on public.placement_talent_managers for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- talent_manager_reviews: TM's own "ALLES KLOPT" — kept entirely separate
-- from placement_reviews (the AM confirmation), since the same person can
-- be both an AM and a TM with two independent scopes to confirm.
-- ---------------------------------------------------------------------------

create table if not exists public.talent_manager_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  verified_at timestamptz not null default now(),
  placement_count_at_verification integer not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.talent_manager_reviews enable row level security;

create policy "talent_manager_reviews are readable by any authenticated user"
  on public.talent_manager_reviews for select
  to authenticated
  using (true);

create policy "a user may upsert their own talent_manager_review"
  on public.talent_manager_reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "a user may update their own talent_manager_review"
  on public.talent_manager_reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "a user may delete their own talent_manager_review"
  on public.talent_manager_reviews for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- team_member_roles: a descriptive roster overlay only (admin/accountmanager/
-- talent_manager, non-exclusive — a person can hold more than one). This
-- table never gates data access by itself: AM access is still purely
-- "owner_email matches", TM access is still purely "a
-- placement_talent_managers row exists for that email". It exists so the
-- future team-member invite step can tag each person's role(s) cleanly,
-- without a fragile single-enum column.
-- ---------------------------------------------------------------------------

create table if not exists public.team_member_roles (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  role text not null check (role in ('admin', 'accountmanager', 'talent_manager')),
  created_at timestamptz not null default now(),
  unique (email_normalized, role)
);

alter table public.team_member_roles enable row level security;

create policy "team_member_roles are readable by any authenticated user"
  on public.team_member_roles for select
  to authenticated
  using (true);

create policy "an admin may manage team_member_roles"
  on public.team_member_roles for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- Verification invalidation, extended for TM:
--  - editing/deleting a placement invalidates every currently-linked TM's
--    confirmation (their linked portfolio's content changed) — on top of
--    the existing AM invalidation trigger on public.projects, untouched.
--  - linking or unlinking a TM on a placement (an admin action) invalidates
--    that specific TM's confirmation (their linked portfolio itself
--    changed), whether that grows or shrinks their scope.
-- ---------------------------------------------------------------------------

create or replace function public.invalidate_linked_talent_manager_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.id, old.id);
  delete from public.talent_manager_reviews tmr
  using public.placement_talent_managers ptm, auth.users u
  where ptm.project_id = pid
    and u.id = tmr.user_id
    and public.normalize_email(u.email) = public.normalize_email(ptm.talent_manager_email);
  return coalesce(new, old);
end;
$$;

revoke execute on function public.invalidate_linked_talent_manager_reviews() from public;
revoke execute on function public.invalidate_linked_talent_manager_reviews() from anon;
revoke execute on function public.invalidate_linked_talent_manager_reviews() from authenticated;

drop trigger if exists projects_invalidate_linked_tm_reviews on public.projects;
create trigger projects_invalidate_linked_tm_reviews
  after update or delete on public.projects
  for each row execute function public.invalidate_linked_talent_manager_reviews();

create or replace function public.invalidate_talent_manager_review_on_link_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  target_email := coalesce(new.talent_manager_email, old.talent_manager_email);
  delete from public.talent_manager_reviews tmr
  using auth.users u
  where u.id = tmr.user_id
    and public.normalize_email(u.email) = public.normalize_email(target_email);
  return coalesce(new, old);
end;
$$;

revoke execute on function public.invalidate_talent_manager_review_on_link_change() from public;
revoke execute on function public.invalidate_talent_manager_review_on_link_change() from anon;
revoke execute on function public.invalidate_talent_manager_review_on_link_change() from authenticated;

drop trigger if exists ptm_invalidate_tm_review on public.placement_talent_managers;
create trigger ptm_invalidate_tm_review
  after insert or update or delete on public.placement_talent_managers
  for each row execute function public.invalidate_talent_manager_review_on_link_change();
