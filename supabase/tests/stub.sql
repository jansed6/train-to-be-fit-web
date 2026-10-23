-- Emulates the parts of Supabase that supabase/schema.sql relies on, so the
-- schema and its access policies can be tested on a plain local Postgres.
-- Run as the `postgres` superuser before schema.sql (see run.sh).

create schema if not exists auth;
create schema if not exists tests;

create table if not exists auth.users (
  id uuid primary key,
  email text
);

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;

grant usage on schema public, auth, tests to anon, authenticated;

-- Supabase hands every new table and function in `public` to both API roles.
-- The schema therefore has to revoke what it doesn't want them to have.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;

-- Exactly as Supabase defines them: both read the JWT claims of the request.
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

-- Test helpers. Owned by postgres but not `security definer`, so they run as
-- the calling role and Row-Level Security still applies to what they do.

-- Act as a signed-in user for the rest of the session.
create or replace function tests.login(p_id uuid, p_email text) returns void
language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated')::text,
    false
  );
end
$$;

-- Fail unless p_sql raises an error whose message contains p_expected or
-- whose SQLSTATE equals p_expected. A failing statement leaves no changes.
create or replace function tests.expect_error(p_sql text, p_expected text, p_label text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_expected in sqlerrm) > 0 or sqlstate = p_expected then
      return;
    end if;
    raise exception '%: expected error "%", got "%" (SQLSTATE %)', p_label, p_expected, sqlerrm, sqlstate;
  end;
  raise exception '%: expected error "%", but the statement succeeded', p_label, p_expected;
end
$$;
