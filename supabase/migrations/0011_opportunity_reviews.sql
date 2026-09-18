-- Mission Hunt: sales-meeting opportunity review + commitment receipt.
--
-- This adds a REVIEW STATE on top of the existing automatic opportunity
-- detection (VERLENGKANS/TIMINGKANS/DOUBLE OPPORTUNITY/URENKANS) — it never
-- replaces or recomputes those badges, which stay purely date/FTE-derived
-- (missionHuntClassification.ts, untouched).
--
-- placement_reviews/talent_manager_reviews are portfolio-wide "ALLES KLOPT"
-- snapshots (one row per person) and are not a fit for a per-placement
-- decision, so this is a new table instead: one row per placement,
-- upserted by project_id — MVP scope is "current state", not an audit
-- trail. Additive and reversible: no existing table/column is touched, and
-- dropping this table later would not affect the 218 placements or any
-- other Mission Hunt data.

create table public.opportunity_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null check (status in ('opvolgen', 'geen_kans', 'later')),
  action_type text check (action_type is null or action_type in ('uren_ophogen', 'verlenging_bespreken', 'timing_inschieten', 'anders')),
  note text,
  reviewer_email text not null,
  reviewer_display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create index opportunity_reviews_project_id_idx on public.opportunity_reviews (project_id);

alter table public.opportunity_reviews enable row level security;

-- Same "trusted team, fully authenticated-only" model as every other
-- Mission Hunt table since migration 0010 — no anon access at all.
create policy "the authenticated trusted team may fully manage opportunity_reviews"
  on public.opportunity_reviews for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.opportunity_reviews from anon;
