-- Mission Hunt v2: email is the ownership key.
--
-- The office manager's central Excel assigns every placement to an account
-- manager by email BEFORE that person may have ever logged in — there is no
-- auth.users row yet to reference. owner_id therefore becomes nullable, and
-- owner_email (normalized) becomes the durable ownership key. Once the
-- matching person signs in and touches their own placement (edit, or the
-- "ALLES KLOPT" flow reading their own rows), owner_id is naturally filled
-- in by the same RLS check that lets them reach the row at all — see the
-- rewritten policies below.
--
-- projects has 0 rows and profiles has exactly 1 (Bernard, admin) at the
-- time of writing, confirmed via list_tables — every ALTER below is safe
-- with no backfill risk, but is still written defensively (COALESCE-safe
-- backfills, IF NOT EXISTS) so it stays correct if that ever changes before
-- this runs.

-- ---------------------------------------------------------------------------
-- normalize_email: the one shared definition of "same person" by email.
-- ---------------------------------------------------------------------------

create or replace function public.normalize_email(raw text)
returns text
language sql
immutable
as $$
  select lower(trim(raw));
$$;

-- ---------------------------------------------------------------------------
-- profiles: track each person's own normalized email for matching/display.
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists email_normalized text;

update public.profiles p
set email_normalized = public.normalize_email(u.email)
from auth.users u
where u.id = p.user_id
  and p.email_normalized is null;

alter table public.profiles alter column email_normalized set not null;

create or replace function public.handle_new_mission_hunt_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, email_normalized)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    public.normalize_email(new.email)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- team_members: the future invite roster. Empty until Bernard supplies the
-- real name/email list — nothing here invents participants.
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email_normalized text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members are readable by any authenticated user"
  on public.team_members for select
  to authenticated
  using (true);

create policy "an admin may manage team_members"
  on public.team_members for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------------------
-- projects (placements): owner_email is now the ownership key, owner_id is
-- an optional accelerator that fills in once the person has logged in and
-- touched the row. project_name is no longer part of the placement import
-- (Professional + Klant carry that role now) so it becomes optional.
-- ---------------------------------------------------------------------------

alter table public.projects add column if not exists owner_email text;
alter table public.projects add column if not exists owner_display_name text;

update public.projects pr
set owner_email = public.normalize_email(u.email)
from auth.users u
where u.id = pr.owner_id
  and pr.owner_email is null;

update public.projects pr
set owner_display_name = p.display_name
from public.profiles p
where p.user_id = pr.owner_id
  and pr.owner_display_name is null;

alter table public.projects alter column owner_email set not null;
alter table public.projects alter column owner_id drop not null;
alter table public.projects alter column project_name drop not null;

create index if not exists projects_owner_email_norm_idx on public.projects (public.normalize_email(owner_email));

-- Member policies: reachable by owner_id OR by an unclaimed row whose
-- owner_email matches the signed-in user's own email (the central-import
-- case, before that person's first edit). The WITH CHECK on insert/update
-- pins the resulting row to owner_id = auth.uid() and owner_email = the
-- caller's own email — a member can never write a row that ends up
-- belonging (by id or by email) to anyone else, and editing an unclaimed
-- row naturally "claims" it by setting owner_id in the same statement.

drop policy if exists "a user may insert their own projects" on public.projects;
create policy "a user may insert their own projects"
  on public.projects for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and public.normalize_email(owner_email) = public.normalize_email(auth.email())
  );

drop policy if exists "a user may update their own projects" on public.projects;
create policy "a user may update their own projects"
  on public.projects for update
  to authenticated
  using (
    owner_id = auth.uid()
    or (owner_id is null and public.normalize_email(owner_email) = public.normalize_email(auth.email()))
  )
  with check (
    owner_id = auth.uid()
    and public.normalize_email(owner_email) = public.normalize_email(auth.email())
  );

drop policy if exists "a user may delete their own projects" on public.projects;
create policy "a user may delete their own projects"
  on public.projects for delete
  to authenticated
  using (
    owner_id = auth.uid()
    or (owner_id is null and public.normalize_email(owner_email) = public.normalize_email(auth.email()))
  );

-- Admin insert: the central Team Placement Import runs as whichever admin
-- account uploaded the file, writing owner_id = null (or a specific
-- reassignment target) + owner_email for people who may never have signed
-- in yet — the member insert policy above could never allow that.
drop policy if exists "an admin may insert any project" on public.projects;
create policy "an admin may insert any project"
  on public.projects for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- Existing admin update/delete policies (0001) already use "using
-- (exists admin) with check (true)" / "using (exists admin)" — still
-- correct as-is for reassignment and admin delete, left untouched.

-- ---------------------------------------------------------------------------
-- placement_reviews: "ALLES KLOPT" — one row per person, upserted on
-- confirmation, wiped by the trigger below the instant the underlying
-- placement set changes.
-- ---------------------------------------------------------------------------

create table if not exists public.placement_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  verified_at timestamptz not null default now(),
  placement_count_at_verification integer not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.placement_reviews enable row level security;

create policy "placement_reviews are readable by any authenticated user"
  on public.placement_reviews for select
  to authenticated
  using (true);

create policy "a user may upsert their own placement_review"
  on public.placement_reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "a user may update their own placement_review"
  on public.placement_reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "a user may delete their own placement_review"
  on public.placement_reviews for delete
  to authenticated
  using (user_id = auth.uid());

-- Any insert/update/delete on a placement invalidates that placement's
-- owner's confirmation — covers both the owner's own edits and a central
-- admin import that changes or adds one of their rows. An import that
-- leaves a row genuinely UNCHANGED never issues a write for it at all (see
-- the app-side import preview), so that owner's confirmation is correctly
-- left standing. security definer + fixed search_path so it can read
-- auth.users to resolve an unclaimed (owner_id is null) row's user_id.
create or replace function public.invalidate_placement_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_owner_id uuid;
  target_owner_email text;
  prior_owner_id uuid;
  prior_owner_email text;
begin
  if (tg_op = 'DELETE') then
    target_owner_id := old.owner_id;
    target_owner_email := old.owner_email;
  else
    target_owner_id := new.owner_id;
    target_owner_email := new.owner_email;
  end if;

  if target_owner_id is not null then
    delete from public.placement_reviews where user_id = target_owner_id;
  elsif target_owner_email is not null then
    delete from public.placement_reviews pr
    using auth.users u
    where u.id = pr.user_id
      and public.normalize_email(u.email) = public.normalize_email(target_owner_email);
  end if;

  -- On UPDATE, a reassignment away from the previous owner invalidates
  -- their confirmation too, not just the new owner's.
  if (tg_op = 'UPDATE') then
    prior_owner_id := old.owner_id;
    prior_owner_email := old.owner_email;

    if prior_owner_id is not null and prior_owner_id is distinct from new.owner_id then
      delete from public.placement_reviews where user_id = prior_owner_id;
    elsif prior_owner_id is null and prior_owner_email is not null
      and public.normalize_email(prior_owner_email) is distinct from public.normalize_email(new.owner_email) then
      delete from public.placement_reviews pr
      using auth.users u
      where u.id = pr.user_id
        and public.normalize_email(u.email) = public.normalize_email(prior_owner_email);
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.invalidate_placement_review() from public;
revoke execute on function public.invalidate_placement_review() from anon;
revoke execute on function public.invalidate_placement_review() from authenticated;

drop trigger if exists projects_invalidate_review on public.projects;
create trigger projects_invalidate_review
  after insert or update or delete on public.projects
  for each row execute function public.invalidate_placement_review();
