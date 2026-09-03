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

## Deploy on Vercel

1. Import this repository in Vercel (the app is at the repo root — no root
   directory config needed).
2. Add two environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

After deploying, add your Vercel URL to Supabase → Authentication → URL
Configuration (Site URL + Redirect URLs) so confirmation/reset emails work.

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
