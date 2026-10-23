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
2. Add two environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

After deploying, add your Vercel URL to Supabase → Authentication → URL
Configuration (Site URL + Redirect URLs) so confirmation/reset emails work.

## Setup

After pulling updates, run the whole `supabase/schema.sql` in the Supabase SQL
editor to apply schema changes. In Supabase → Authentication → Email, keep
"Confirm email" enabled — trainer invites are matched by the email in the
sign-in token.

## Structure

- `app/` — Next.js App Router pages (home, workout, history, progress, plans, sign-in gate)
- `components/` — UI primitives and feature components
- `lib/` — Supabase client, auth, data access (`repo.ts`), hooks, domain logic
- `supabase/schema.sql` — database schema (run once in the Supabase SQL editor)

## Features

Plans built by picking from an exercise catalogue (or custom), a scrollable
workout logger with ± steppers and a rest timer, weight prefill from the last
session, workout history, and per-exercise progress charts. Data is stored
per-user in Supabase Postgres with Row-Level Security.

**Trainer role:** any user can invite a client by email (Clients page); the
client accepts on Home; the trainer builds plans in the client's account with
reps and an optional weight per set; the client trains with those targets
prefilled (only ticked sets are saved); the trainer sees the client's workout
count, week, each workout compared with the plan (skipped / below target), and
exercise progress charts; either side can end the coaching, after which the
trainer's plans become the client's own.

## Credits

- Exercise photos and how-to steps: [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (Unlicense / public domain) — `public/exercises/`, `lib/exerciseSteps.ts`.
- Body muscle map (SVG paths): [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
  by Hicham Elabbassi, MIT License — see `lib/bodyMapData.ts`.
