-- Run this once in the Supabase SQL editor.
-- Plans and workout sessions are stored as JSONB documents owned by a user,
-- protected by Row-Level Security so each user only sees their own rows.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  date timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.sessions enable row level security;

create policy "own plans" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists plans_user_created on public.plans (user_id, created_at desc);
create index if not exists sessions_user_date on public.sessions (user_id, date desc);
