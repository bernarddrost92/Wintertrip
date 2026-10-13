-- FTE-bonnen: the Net FTE tab's shared list of expected FTE growth
-- (verlengingen, PO → contract, BPT verlengen, nieuwe contractanten). Open
-- bonnen are added on top of the official Power BI Net FTE to project
-- Zwolle's Net FTE ranking and factor; a bon marked "gerealiseerd" drops out
-- of the projection, because by then it shows up in the official Net FTE.
--
-- Same access model as every other table since migration 0010: readable and
-- writable only by the authenticated shared Team Zwolle session, nothing
-- for anon. Labels are free text, so the UI asks for initials or a short
-- label rather than full names.
--
-- Applied to the live project as fte_bonnen_table, fte_bonnen_policy,
-- fte_bonnen_grants and fte_bonnen_updated_at_trigger.

create table if not exists public.fte_bonnen (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 80),
  action_type text not null check (action_type in ('VERLENGING', 'PO_NAAR_CONTRACT', 'BPT_VERLENGEN', 'NIEUWE_CONTRACTANT', 'ANDERS')),
  fte_delta numeric(6, 2) not null check (fte_delta between -50 and 50),
  owner text check (owner is null or char_length(owner) <= 40),
  note text check (note is null or char_length(note) <= 200),
  status text not null default 'open' check (status in ('open', 'gerealiseerd')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists fte_bonnen_set_updated_at on public.fte_bonnen;
create trigger fte_bonnen_set_updated_at
  before update on public.fte_bonnen
  for each row execute function public.set_updated_at();

alter table public.fte_bonnen enable row level security;

drop policy if exists "the authenticated trusted team may manage fte_bonnen" on public.fte_bonnen;
create policy "the authenticated trusted team may manage fte_bonnen"
  on public.fte_bonnen for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.fte_bonnen from anon;
grant select, insert, update, delete on public.fte_bonnen to authenticated;
