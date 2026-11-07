# Train to be fit

A web workout tracker — **Next.js + TypeScript + Tailwind**, with accounts and
cloud storage via **Supabase**.

## Run locally

```bash
cp .env.local.example .env.local   # fill in your Supabase URL + publishable key
npm install
npm run dev
```

Open http://localhost:3000.

**Tests:**

```bash
npm test              # unit tests (lib/**/*.test.ts; TZ pinned to Europe/Bratislava)
npm run test:db       # DB tests (needs local Postgres binaries; Postgres.app or $PG_BIN)
```

## Deploy on Vercel

1. Import this repository in Vercel (the app is at the repo root — no root
   directory config needed).
2. Add the environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API Keys, the
     secret / `service_role` key. Server-only (no `NEXT_PUBLIC_`): it lets
     `app/api/clients` create a client's account and email the invite. Without
     it, adding a client falls back to a plain invite they accept on Home.
3. Deploy (and redeploy after changing a variable).

After deploying, add your Vercel URL to Supabase → Authentication → URL
Configuration (Site URL + Redirect URLs) so confirmation/reset emails work.
Password-reset links return to the site they were requested from, so add
`http://localhost:3000` to Redirect URLs as well to try them locally. Supabase's
built-in email sender only sends a few emails per hour; set up custom SMTP
(Authentication → Emails) before real users rely on resets.

## Setup

**Database first, then the app.** Before merging or deploying a change that
touches `supabase/schema.sql` (including the trainer role), run the whole
`supabase/schema.sql` in the Supabase SQL editor. Vercel deploys every merge to
`main`, and the new frontend reads columns, tables and functions the schema adds
(e.g. `plans.trainer_id`, `coachings`): if it goes live before the SQL has run,
Home shows no plans, a workout hangs on "Loading…", and Clients and the invite
banner stay blank. The schema is safe to run first — it is idempotent and the
current frontend keeps working on it.

In Supabase → Authentication → Email, keep "Confirm email" enabled — trainer
invites are matched by the email in the sign-in token.

**Trainers.** Adding a client can email an invite to any address, so only
users in `public.trainers` can do it (at most 20 new clients a day). The first
run of the schema makes everyone who already coaches a trainer; add others in
the SQL editor:

```sql
insert into public.trainers (user_id)
  select id from auth.users where email = 'trainer@example.com';
```

**Supabase settings for production.**

- Custom SMTP (Authentication → Emails → SMTP Settings), e.g. Resend or Brevo,
  with SPF/DKIM on your domain. Supabase's built-in sender only emails your
  Supabase team members, 2 emails an hour.
- Authentication → Email → Minimum password length: 8 (the app asks for 8).
- If clients only join through a trainer's invite, turn off "Allow new users
  to sign up" (Authentication → Sign In / Providers): the invite still creates
  their account. If sign-up stays open, enable CAPTCHA (Attack Protection) —
  the app would then need the CAPTCHA widget on its sign-up form.
- Use a dedicated secret key (`sb_secret_…`) for `SUPABASE_SERVICE_ROLE_KEY`,
  so it can be revoked on its own.

## Structure

- `app/` — Next.js App Router pages (home, workout, history, progress, plans, sign-in gate)
- `components/` — UI primitives and feature components
- `lib/` — Supabase client, auth, data access (`repo.ts`), hooks, domain logic
- `supabase/schema.sql` — database schema (re-runnable; run it in the Supabase SQL editor before deploying a change to it — see Setup)

## Features

Plans built by picking from an exercise catalogue (or custom), a scrollable
workout logger with ± steppers and a rest timer, weight prefill from the last
session, workout history, and per-exercise progress charts. Data is stored
per-user in Supabase Postgres with Row-Level Security.

**Account:** reset a forgotten password from the sign-in screen (email link),
change it or sign out (this device or all devices) on the Account page. Each
browser signs out by itself after 14 days without opening the app and 30 days
after signing in (`lib/sessionPolicy.ts`), but never during a workout.

**Trainer role:** any user can add a client by email (Clients → + Add
client). A new email gets an account and an invite email; the trainer builds
plans right away, and the client opens the link, sets a password and finds
them waiting (the trainer can resend the invite until they sign in). Someone
who already has an account gets an invite to accept on Home instead. The
Clients list shows each client's last workout; the trainer builds plans in the
client's account with reps and an optional weight per set; the client trains
with those targets prefilled (only ticked sets are saved); the trainer sees the
client's workout count, week, each workout compared with the plan (skipped /
below target), and exercise progress charts. The trainer ends the coaching at the bottom of the client's page; the
client can leave from the Account page. Either way the trainer's plans become
the client's own.

## Credits

- Exercise photos and how-to steps: [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (Unlicense / public domain) — `public/exercises/`, `lib/exerciseSteps.ts`.
- Body muscle map (SVG paths): [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
  by Hicham Elabbassi, MIT License — see `lib/bodyMapData.ts`.
