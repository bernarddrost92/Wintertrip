-- Round 1 security implementation: replace the purely client-side "Zwolle"
-- access code with real Supabase Auth, using ONE shared Team Zwolle
-- password behind a single technical auth user. From this migration
-- forward, every Mission Hunt / League Check request the frontend makes
-- runs as `authenticated` (signed in as the shared technical account), never
-- as `anon` — so this migration both provisions that technical user AND
-- closes the `anon` access that migration 0009 opened as an accepted
-- temporary state ("That was accepted temporarily. Now close that again.").
--
-- WIE BEN JIJ? remains UX-only identity, completely separate from this auth
-- session — nothing here ties CURRENT AGENT to the technical account, and
-- the trusted-team open-edit model itself (every authenticated request may
-- read/write everything) is intentionally UNCHANGED, only which *role*
-- (anon vs authenticated) is allowed to reach it.

-- ---------------------------------------------------------------------------
-- Technical Team Zwolle auth user — the security gate account.
--
-- Created directly in auth.users/auth.identities, matching the exact
-- pattern already used for every real team member's row (see migration
-- 0009's own comment: "auth.users itself... is untouched" from before it —
-- those 25 rows were themselves seeded by direct insert, not GoTrue's admin
-- API). No confirmation email, no invite, no OTP, no magic link.
--
-- encrypted_password is intentionally left NULL here — this account is not
-- usable to sign in yet. The actual shared password must be set once by the
-- product owner directly in Supabase Studio (Authentication -> Users ->
-- teamzwolle@wintertrip.internal -> Reset password), so the plaintext
-- password never has to pass through this migration, git history, or any
-- tool/log. This is deliberate, not an oversight — see the deploy report
-- for the exact pause-and-set-it step.
-- ---------------------------------------------------------------------------

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'teamzwolle@wintertrip.internal';

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'teamzwolle@wintertrip.internal',
      null,
      now(),
      now(), now(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, false
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'teamzwolle@wintertrip.internal', 'email_verified', true),
      'email',
      now(), now(), now()
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- profiles / team_members / team_member_roles: read-only roster overlays.
-- WIE BEN JIJ? now runs only after a real authenticated session exists, so
-- the anon-readable exception from migration 0009 is no longer needed.
-- ---------------------------------------------------------------------------

drop policy if exists "profiles are readable by the trusted team" on public.profiles;
create policy "profiles are readable by the authenticated trusted team"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "team_members are readable by the trusted team" on public.team_members;
create policy "team_members are readable by the authenticated trusted team"
  on public.team_members for select
  to authenticated
  using (true);

drop policy if exists "team_member_roles are readable by the trusted team" on public.team_member_roles;
create policy "team_member_roles are readable by the authenticated trusted team"
  on public.team_member_roles for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- projects (placements): unchanged trusted-team full-access model, just
-- scoped to authenticated only.
-- ---------------------------------------------------------------------------

drop policy if exists "the trusted team may fully manage projects" on public.projects;
create policy "the authenticated trusted team may fully manage projects"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- placement_talent_managers
-- ---------------------------------------------------------------------------

drop policy if exists "the trusted team may fully manage placement_talent_managers" on public.placement_talent_managers;
create policy "the authenticated trusted team may fully manage placement_talent_managers"
  on public.placement_talent_managers for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- placement_reviews / talent_manager_reviews
-- ---------------------------------------------------------------------------

drop policy if exists "the trusted team may fully manage placement_reviews" on public.placement_reviews;
create policy "the authenticated trusted team may fully manage placement_reviews"
  on public.placement_reviews for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "the trusted team may fully manage talent_manager_reviews" on public.talent_manager_reviews;
create policy "the authenticated trusted team may fully manage talent_manager_reviews"
  on public.talent_manager_reviews for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- league_check_receipts
-- ---------------------------------------------------------------------------

drop policy if exists "the trusted team may register league_check_receipts" on public.league_check_receipts;
create policy "the authenticated trusted team may register league_check_receipts"
  on public.league_check_receipts for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Defense in depth: RLS policies above already deny every anon row-level
-- operation once no anon-scoped policy exists, but the raw GRANTs handed to
-- anon back when these tables were first created are revoked too, so there
-- is no ambiguity about anon's access at either layer.
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke all on public.team_members from anon;
revoke all on public.team_member_roles from anon;
revoke all on public.projects from anon;
revoke all on public.placement_talent_managers from anon;
revoke all on public.placement_reviews from anon;
revoke all on public.talent_manager_reviews from anon;
revoke all on public.league_check_receipts from anon;

-- get_league_check_stats() is a SECURITY DEFINER RPC — it bypasses RLS by
-- design, so its own EXECUTE grant is the only thing gating it. Every
-- caller is authenticated now (League Check only ever renders behind the
-- new shared-password gate), so the anon grant from migration
-- 0003/0009-era setup is revoked; authenticated keeps it.
revoke execute on function public.get_league_check_stats() from anon;
