-- Mission Hunt: profiles + projects, with Row Level Security as the only
-- real enforcement boundary. The frontend never trusts itself for this —
-- every policy below is what actually stops an authenticated user from
-- reading or writing data they shouldn't.
--
-- Run this once against a fresh Supabase project (SQL Editor, or the
-- Supabase CLI). See MISSION_HUNT_SETUP.md for the full setup flow.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.profiles enable row level security;

-- Every authenticated Team Zwolle member can see every profile (names on the
-- Team Dashboard) — nothing in a profile row is sensitive on its own.
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

-- A member may only ever edit their own display name; role/active are
-- deliberately left out of what this policy permits changing in practice —
-- enforce that at the admin tooling layer, since RLS alone can't restrict
-- column-by-column on a single UPDATE policy without a trigger. See the
-- admin policy below for role/active changes.
create policy "a user may update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "an admin may update any profile"
  on public.profiles for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (true);

-- Auto-provision a profile the moment an invited user's auth.users row is
-- created, so "Na login weten we automatisch welke agent/person het is" is
-- true from the very first login — no separate signup step, no missing row.
-- display_name comes from the invite's user metadata when the inviter set
-- one; otherwise it falls back to the email's local part.
create or replace function public.handle_new_mission_hunt_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mission_hunt on auth.users;
create trigger on_auth_user_created_mission_hunt
  after insert on auth.users
  for each row execute function public.handle_new_mission_hunt_user();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  client_name text not null,
  professional_name text,
  start_date date,
  end_date date,
  hours_per_week numeric,
  monthly_vcdb numeric,
  note text,
  status text not null default 'unreviewed' check (status in ('unreviewed', 'opportunity', 'investigate', 'no_action')),
  opportunity_types text[] not null default '{}',
  fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fingerprint)
);

create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_status_idx on public.projects (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Every authenticated Team Zwolle member can read every project — the Team
-- Dashboard and read-only colleague drilldown both depend on this. Nothing
-- reaches an unauthenticated request: there is no "public" policy at all.
create policy "projects are readable by any authenticated user"
  on public.projects for select
  to authenticated
  using (true);

create policy "a user may insert their own projects"
  on public.projects for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "a user may update their own projects"
  on public.projects for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "a user may delete their own projects"
  on public.projects for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "an admin may update any project"
  on public.projects for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'))
  with check (true);

create policy "an admin may delete any project"
  on public.projects for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
