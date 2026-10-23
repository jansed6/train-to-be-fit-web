-- Run this whole file in the Supabase SQL editor. It is safe to run again:
-- run the whole file again after pulling changes.
--
-- Plans and workout sessions are stored as JSONB documents owned by a user and
-- protected by Row-Level Security. Users see only their own rows, except that
-- an active trainer can read a client's plans and sessions and manage the
-- plans that trainer built for the client.
--
-- Trainer–client links live in `coachings`. Users can only read them; every
-- change goes through the security definer functions below (called via RPC).
--
-- Tests: npm run test:db (supabase/tests/).

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

-- The trainer who built the plan for its owner (the client). Null for the
-- owner's own plans, which are the only plans the owner can change.
alter table public.plans
  add column if not exists trainer_id uuid references auth.users(id) on delete set null;

create index if not exists plans_user_created on public.plans (user_id, created_at desc);
create index if not exists sessions_user_date on public.sessions (user_id, date desc);

-- MARK: Coachings

-- An invite from a trainer to an email address and, once accepted, the link
-- between the trainer and the client's account.
create table if not exists public.coachings (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  trainer_email text not null,
  client_email text not null check (client_email = lower(client_email)),
  client_name text,
  client_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'declined', 'cancelled', 'ended')),
  created_at timestamptz not null default now()
);

-- A client has at most one active trainer.
create unique index if not exists coachings_one_active_trainer
  on public.coachings (client_id) where status = 'active';
-- A trainer has at most one open invite or coaching per email.
create unique index if not exists coachings_one_open_per_email
  on public.coachings (trainer_id, client_email) where status in ('pending', 'active');

-- Read only for users (see the policy below); the functions write as owner.
revoke insert, update, delete, truncate on public.coachings from anon, authenticated;

-- MARK: Functions

-- Is the caller the active trainer of this user? Used by the plan and session
-- policies. Security definer so it can read coachings regardless of RLS.
create or replace function public.is_active_trainer_of(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coachings
    where trainer_id = auth.uid() and client_id = p_client and status = 'active'
  );
$$;

-- The caller invites an email to be their client. Never reveals whether an
-- account with that email exists.
create or replace function public.invite_client(p_email text, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if v_email = lower(auth.jwt() ->> 'email') then
    raise exception 'cannot_invite_self';
  end if;
  begin
    insert into public.coachings (trainer_id, trainer_email, client_email, client_name)
    values (auth.uid(), auth.jwt() ->> 'email', v_email, nullif(trim(p_name), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'already_invited';
  end;
  return v_id;
end;
$$;

-- The invited user accepts or declines a pending invite sent to their email.
create or replace function public.respond_to_invite(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.coachings
  where id = p_id
    and status = 'pending'
    and client_email = lower(auth.jwt() ->> 'email')
    and trainer_id <> auth.uid()
  for update;
  if not found then
    raise exception 'invite_not_found';
  end if;

  if p_accept then
    if exists (
      select 1 from public.coachings where client_id = auth.uid() and status = 'active'
    ) then
      raise exception 'already_has_trainer';
    end if;
    begin
      update public.coachings set status = 'active', client_id = auth.uid() where id = p_id;
    exception when unique_violation then
      -- Another invite was accepted at the same moment.
      raise exception 'already_has_trainer';
    end;
  elsif not p_accept then
    update public.coachings set status = 'declined' where id = p_id;
  end if;
end;
$$;

-- The trainer withdraws a pending invite.
create or replace function public.cancel_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coachings set status = 'cancelled'
  where id = p_id and trainer_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'invite_not_found';
  end if;
end;
$$;

-- Either side ends an active coaching. The trainer loses access at once, and
-- the plans the trainer built become the client's own.
create or replace function public.end_coaching(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer uuid;
  v_client uuid;
begin
  update public.coachings set status = 'ended'
  where id = p_id
    and status = 'active'
    and (trainer_id = auth.uid() or client_id = auth.uid())
  returning trainer_id, client_id into v_trainer, v_client;
  if not found then
    raise exception 'coaching_not_found';
  end if;

  update public.plans set trainer_id = null
  where user_id = v_client and trainer_id = v_trainer;
end;
$$;

-- Supabase lets anon and authenticated execute new functions by default.
revoke execute on function public.is_active_trainer_of(uuid) from public, anon;
revoke execute on function public.invite_client(text, text) from public, anon;
revoke execute on function public.respond_to_invite(uuid, boolean) from public, anon;
revoke execute on function public.cancel_invite(uuid) from public, anon;
revoke execute on function public.end_coaching(uuid) from public, anon;
grant execute on function public.is_active_trainer_of(uuid) to authenticated;
grant execute on function public.invite_client(text, text) to authenticated;
grant execute on function public.respond_to_invite(uuid, boolean) to authenticated;
grant execute on function public.cancel_invite(uuid) to authenticated;
grant execute on function public.end_coaching(uuid) to authenticated;

-- MARK: Row-Level Security

alter table public.plans enable row level security;
alter table public.sessions enable row level security;
alter table public.coachings enable row level security;

-- Replaced by the policies below.
drop policy if exists "own plans" on public.plans;
drop policy if exists "own sessions" on public.sessions;

-- Coachings: read only; every write goes through the functions above.
-- The trainer and the client see their coachings; the invited user sees
-- pending invites sent to their email.
drop policy if exists "read coachings" on public.coachings;
create policy "read coachings" on public.coachings
  for select to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid()
         or (status = 'pending' and client_email = lower(auth.jwt() ->> 'email')));

-- Plans: the owner and their active trainer read them. The owner writes only
-- their own plans (no trainer); the active trainer writes only the client's
-- plans that trainer built.
drop policy if exists "read plans" on public.plans;
create policy "read plans" on public.plans
  for select to authenticated
  using (user_id = auth.uid() or public.is_active_trainer_of(user_id));

drop policy if exists "insert plans" on public.plans;
create policy "insert plans" on public.plans
  for insert to authenticated
  with check ((user_id = auth.uid() and trainer_id is null)
              or (trainer_id = auth.uid() and public.is_active_trainer_of(user_id)));

drop policy if exists "update plans" on public.plans;
create policy "update plans" on public.plans
  for update to authenticated
  using ((user_id = auth.uid() and trainer_id is null)
         or (trainer_id = auth.uid() and public.is_active_trainer_of(user_id)))
  with check ((user_id = auth.uid() and trainer_id is null)
              or (trainer_id = auth.uid() and public.is_active_trainer_of(user_id)));

drop policy if exists "delete plans" on public.plans;
create policy "delete plans" on public.plans
  for delete to authenticated
  using ((user_id = auth.uid() and trainer_id is null)
         or (trainer_id = auth.uid() and public.is_active_trainer_of(user_id)));

-- Sessions: the owner and their active trainer read them; only the owner
-- writes them.
drop policy if exists "read sessions" on public.sessions;
create policy "read sessions" on public.sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_active_trainer_of(user_id));

drop policy if exists "insert sessions" on public.sessions;
create policy "insert sessions" on public.sessions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update sessions" on public.sessions;
create policy "update sessions" on public.sessions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete sessions" on public.sessions;
create policy "delete sessions" on public.sessions
  for delete to authenticated
  using (user_id = auth.uid());
