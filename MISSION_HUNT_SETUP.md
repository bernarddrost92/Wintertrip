# Mission Hunt — setup guide

Mission Hunt is the only part of this app backed by a real database
(Supabase: Auth + Postgres + Row Level Security). Every other feature
(Calculator, League Check, Mission Control, Mission Updates) works with zero
configuration. Until you complete the steps below, Mission Hunt shows
**SETUP REQUIRED** instead of crashing or falling back to fake data.

Commercial project data (client names, professional names, project details)
lives only in your own Supabase project — never in this repository, never in
a JSON file, never in `localStorage`.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (any
   name, any region close to your team).
2. Wait for it to finish provisioning.

## 2. Run the migration

1. Open the Supabase dashboard → **SQL Editor**.
2. Open `supabase/migrations/0001_mission_hunt.sql` from this repository,
   copy its full contents, paste into a new SQL Editor query, and run it.
3. This creates the `profiles` and `projects` tables, their indexes, the
   unique fingerprint constraint (duplicate protection), every Row Level
   Security policy, and the trigger that auto-provisions a profile the
   moment an invited user first signs in.

## 3. Set the Auth redirect URL

1. Dashboard → **Authentication → URL Configuration**.
2. Set **Site URL** to your deployed app's URL, e.g.
   `https://bernarddrost92.github.io/Wintertrip/`.
3. Add the same URL under **Redirect URLs** (needed for the magic-link email
   to send people back to the right place). If you also test locally, add
   `http://localhost:5173/` too.

## 4. Invite your team members

Mission Hunt is invite-only — nobody can sign themselves up.

1. Dashboard → **Authentication → Users → Invite user**.
2. Enter each Team Zwolle member's email address.
3. Optional but recommended: under that invite's **User metadata**, add
   `{"display_name": "Bernard"}` (their real name) so their profile is
   created with the right name immediately. If you skip this, their profile
   still gets created automatically on first login — just with the part of
   their email before the `@` as a fallback name, editable later.

Each invited person signs in with **their own email** via a magic link —
there is no password and no name-picker, so nobody can log in pretending to
be someone else.

## 5. Appoint your first admin

By default every invited person is a `member` (can manage their own
projects, read everyone else's read-only). An `admin` can edit or delete
anyone's project too.

To make someone an admin, run this in the SQL Editor once they've signed in
at least once (so their profile row exists):

```sql
update public.profiles set role = 'admin' where display_name = 'Bernard';
```

## 6. Set the environment variables

1. Dashboard → **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public key** (never the
   `service_role` key — that one must never leave the Supabase dashboard).

### For local development

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### For the live GitHub Pages deploy

1. Repository → **Settings → Secrets and variables → Actions**.
2. Add two repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. The deploy workflow (`.github/workflows/deploy.yml`) already reads these
   automatically on the next push to `main` — no workflow file changes
   needed.

## 7. Done

Open the app, go to **Mission Hunt**, sign in with an invited email, and you
should land on **My Projects**. From there: **Download Excel Template**, fill
it in, drag it back into **Import Projects**.

## Adding a new team member later

Repeat step 4 (invite) and, if they should manage others' projects too, step
5 (admin). Nothing else needs to change.
