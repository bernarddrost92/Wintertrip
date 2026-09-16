-- League Check Intelligence: a lightweight, team-wide record of League Check
-- receipts, used only to power a compact quality/control indicator (total
-- receipts, checks completed/max, approved/open) in the Calculator. This is
-- explicitly NOT a scoring table: it carries no VCDB, Base Score, Factor, or
-- Final Score, and must never be read as league points.
--
-- Reuses the same Supabase project and Auth users as Mission Hunt
-- (0001_mission_hunt.sql) but is otherwise independent of it — no foreign
-- keys into profiles/projects. Run this once against the same project (SQL
-- Editor, or the Supabase CLI), after 0001.

create table if not exists public.league_check_receipts (
  -- Client-generated: one League Check session keeps the same id across
  -- repeated "Generate Receipt" clicks, so re-generating upserts the same
  -- row instead of counting as a second receipt.
  id uuid primary key,
  created_by uuid not null references auth.users(id) on delete cascade,
  checked_count int not null check (checked_count >= 0),
  total_checks int not null check (total_checks > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_check_receipts_checked_within_total check (checked_count <= total_checks)
);

create index if not exists league_check_receipts_created_by_idx on public.league_check_receipts (created_by);

-- Same trigger function 0001_mission_hunt.sql defines for projects.updated_at
-- — re-declared here (identical body) so this migration also runs cleanly
-- against a fresh project on its own.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists league_check_receipts_set_updated_at on public.league_check_receipts;
create trigger league_check_receipts_set_updated_at
  before update on public.league_check_receipts
  for each row execute function public.set_updated_at();

alter table public.league_check_receipts enable row level security;

-- Counts only — no client/professional names, no commercial figures — so
-- it's safe to read without being logged in. The Calculator's compact
-- intelligence strip must work for every visitor, not only Mission
-- Hunt-authenticated ones.
create policy "league check receipt counts are readable by anyone"
  on public.league_check_receipts for select
  using (true);

-- Writing a receipt requires a signed-in Supabase user (the same Auth
-- Mission Hunt uses) — deliberately no anon insert/update policy. An
-- unauthenticated visitor can still generate, download and share a receipt
-- exactly as before; it just isn't counted team-wide until they sign in.
create policy "an authenticated user may insert their own receipt"
  on public.league_check_receipts for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "an authenticated user may update their own receipt"
  on public.league_check_receipts for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
