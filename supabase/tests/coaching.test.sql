-- Who may see and change which plans, sessions and coachings.
-- Runs after stub.sql and schema.sql (see run.sh). Any failed check stops the run.
--
-- Users:    T  = 11111111-… trainer@x.test     C  = 22222222-… zuzka@gmail.com (client)
--           S  = 33333333-… stranger@x.test    T2 = 44444444-… trainer2@x.test
-- Plans:    P  = aaaaaaaa-… the plan T builds for C
--           O  = bbbbbbbb-… C's own plan
--           X  = cccccccc-… a plan T builds for C and deletes again
-- Coaching ids returned by invite_client are kept in the settings test.tc
-- (T and C), test.t2c (T2 and C), test.tc2 (T's second invite to C) and
-- test.self (T's invite to the email he then switches to).

\o /dev/null

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'trainer@x.test'),
  ('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com'),
  ('33333333-3333-3333-3333-333333333333', 'stranger@x.test'),
  ('44444444-4444-4444-4444-444444444444', 'trainer2@x.test');

set role authenticated;

-- 1. Invite matching ---------------------------------------------------------

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
do $$
declare
  v_id uuid := public.invite_client('  Zuzka@Gmail.com ', 'Manželka');
  r record;
begin
  perform set_config('test.tc', v_id::text, false);
  select * into r from public.coachings where id = v_id;
  assert r.client_email = 'zuzka@gmail.com', '1: the invited email is trimmed and lowercased';
  assert r.status = 'pending', '1: a new invite is pending';
  assert r.trainer_email = 'trainer@x.test', '1: the trainer email comes from the JWT';
  assert r.client_name = 'Manželka', '1: the client name is stored';
end
$$;

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
do $$
begin
  assert (select count(*) from public.coachings) = 1, '1: C sees exactly the invite for her email';
end
$$;

select tests.login('33333333-3333-3333-3333-333333333333', 'stranger@x.test');
do $$
begin
  assert (select count(*) from public.coachings) = 0, '1: S sees no coaching';
end
$$;

-- 2. Invite errors -----------------------------------------------------------

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
select tests.expect_error($$select public.invite_client('trainer@x.test')$$,
  'cannot_invite_self', '2: T cannot invite himself');
select tests.expect_error($$select public.invite_client('zuzka@gmail.com')$$,
  'already_invited', '2: T cannot invite the same email twice');
select tests.expect_error($$select public.invite_client('not-an-email')$$,
  'invalid_email', '2: T cannot invite something that is not an email');

-- The app maps the message to UI text, so it must be exactly the code.
do $$
begin
  perform public.invite_client('zuzka@gmail.com');
  assert false, '2: a repeated invite is rejected';
exception when raise_exception then
  assert sqlerrm = 'already_invited', '2: the error message is exactly the code';
end
$$;

-- Even after changing his email to one he invited, T can't become his own client.
do $$
begin
  perform set_config('test.self', public.invite_client('new@x.test')::text, false);
end
$$;
select tests.login('11111111-1111-1111-1111-111111111111', 'new@x.test');
select tests.expect_error($$select public.respond_to_invite(current_setting('test.self')::uuid, true)$$,
  'invite_not_found', '2: T cannot accept his own invite');
select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
select public.cancel_invite(current_setting('test.self')::uuid);

-- 3. Pending gives no access -------------------------------------------------

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
insert into public.sessions (user_id, data)
  values ('22222222-2222-2222-2222-222222222222', '{"name": "C session"}');
insert into public.plans (id, user_id, data)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '{"name": "C own plan"}');

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');

-- Coachings are read only for users: T can neither activate the invite himself
-- nor forge an active coaching (either refused or no rows touched).
do $$
declare
  n int;
begin
  update public.coachings
    set status = 'active', client_id = '22222222-2222-2222-2222-222222222222'
    where id = current_setting('test.tc')::uuid;
  get diagnostics n = row_count;
  assert n = 0, '3: T cannot activate the invite directly';
exception when insufficient_privilege then
  null;
end
$$;
select tests.expect_error($$insert into public.coachings (trainer_id, trainer_email, client_email, client_id, status)
  values ('11111111-1111-1111-1111-111111111111', 'trainer@x.test', 'stranger@x.test',
          '33333333-3333-3333-3333-333333333333', 'active')$$,
  '42501', '3: T cannot create a coaching directly');

do $$
begin
  assert (select count(*) from public.sessions where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '3: T with a pending invite sees no sessions of C';
  assert (select count(*) from public.plans where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '3: T with a pending invite sees no plans of C';
end
$$;
select tests.expect_error($$insert into public.plans (user_id, trainer_id, data)
  values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '{}')$$,
  '42501', '3: T with a pending invite cannot create plans for C');

-- 4. Accept ------------------------------------------------------------------

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
select public.respond_to_invite(current_setting('test.tc')::uuid, true);
do $$
declare
  r record;
begin
  select * into r from public.coachings where id = current_setting('test.tc')::uuid;
  assert r.status = 'active', '4: an accepted invite is active';
  assert r.client_id = '22222222-2222-2222-2222-222222222222', '4: the accepting user becomes the client';
end
$$;

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
do $$
begin
  assert (select count(*) from public.sessions where user_id = '22222222-2222-2222-2222-222222222222') = 1,
    '4: the active trainer sees the session of C';
  assert (select count(*) from public.plans where user_id = '22222222-2222-2222-2222-222222222222') = 1,
    '4: the active trainer sees the plan of C';
end
$$;

select tests.login('33333333-3333-3333-3333-333333333333', 'stranger@x.test');
do $$
begin
  assert (select count(*) from public.sessions where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '4: S still sees no sessions of C';
  assert (select count(*) from public.plans where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '4: S still sees no plans of C';
end
$$;

-- 5. Trainer plans -----------------------------------------------------------

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
insert into public.plans (id, user_id, trainer_id, data)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
          '11111111-1111-1111-1111-111111111111', '{"name": "From T"}');

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
do $$
declare
  n int;
begin
  assert (select count(*) from public.plans where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1,
    '5: C reads the plan from her trainer';
  update public.plans set data = data where trainer_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  assert n = 0, '5: C cannot change the plan from her trainer';
  delete from public.plans where trainer_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  assert n = 0, '5: C cannot delete the plan from her trainer';
end
$$;
select tests.expect_error($$insert into public.plans (user_id, trainer_id, data)
  values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '{}')$$,
  '42501', '5: C cannot create a plan in her trainer''s name');
-- What supabase-js upsert sends: overwriting the trainer's plan by id is refused too.
select tests.expect_error($$insert into public.plans (id, user_id, data)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '{}')
  on conflict (id) do update set data = excluded.data$$,
  '42501', '5: C cannot overwrite the plan from her trainer with an upsert');

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
do $$
declare
  n int;
begin
  update public.plans set data = data where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  get diagnostics n = row_count;
  assert n = 0, '5: T cannot change the own plan of C';
  delete from public.plans where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  get diagnostics n = row_count;
  assert n = 0, '5: T cannot delete the own plan of C';

  update public.plans set data = '{"name": "From T, v2"}' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics n = row_count;
  assert n = 1, '5: T changes the plan he built for C';
  insert into public.plans (id, user_id, trainer_id, data)
    values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222',
            '11111111-1111-1111-1111-111111111111', '{"name": "Scratch"}');
  delete from public.plans where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  get diagnostics n = row_count;
  assert n = 1, '5: T deletes a plan he built for C';
end
$$;

-- 6. The trainer can't write sessions ----------------------------------------

select tests.expect_error($$insert into public.sessions (user_id, data)
  values ('22222222-2222-2222-2222-222222222222', '{}')$$,
  '42501', '6: T cannot add a session for C');
do $$
declare
  n int;
begin
  update public.sessions set data = data where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  assert n = 0, '6: T cannot change the sessions of C';
  delete from public.sessions where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  assert n = 0, '6: T cannot delete the sessions of C';
end
$$;

-- 7. One trainer per client --------------------------------------------------

-- T2 can invite C. Nothing tells T2 whether C has an account or a trainer.
select tests.login('44444444-4444-4444-4444-444444444444', 'trainer2@x.test');
do $$
begin
  perform set_config('test.t2c', public.invite_client('zuzka@gmail.com')::text, false);
end
$$;

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
select tests.expect_error($$select public.respond_to_invite(current_setting('test.t2c')::uuid, true)$$,
  'already_has_trainer', '7: C cannot accept a second trainer');

-- 8. Strangers can't act -----------------------------------------------------

select tests.login('33333333-3333-3333-3333-333333333333', 'stranger@x.test');
select tests.expect_error($$select public.end_coaching(current_setting('test.tc')::uuid)$$,
  'coaching_not_found', '8: S cannot end the coaching of T and C');
select tests.expect_error($$select public.cancel_invite(current_setting('test.t2c')::uuid)$$,
  'invite_not_found', '8: S cannot cancel the invite of T2');
select tests.expect_error($$select public.respond_to_invite(current_setting('test.t2c')::uuid, false)$$,
  'invite_not_found', '8: S cannot answer an invite meant for C');

-- Only the trainer cancels; the invited client declines instead.
select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
select tests.expect_error($$select public.cancel_invite(current_setting('test.t2c')::uuid)$$,
  'invite_not_found', '8: C cannot cancel the invite of T2');

-- 9. Ending ------------------------------------------------------------------

select public.end_coaching(current_setting('test.tc')::uuid);

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
do $$
begin
  assert (select count(*) from public.sessions where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '9: the former trainer sees no sessions of C';
  assert (select count(*) from public.plans where user_id = '22222222-2222-2222-2222-222222222222') = 0,
    '9: the former trainer sees no plans of C';
end
$$;
select tests.expect_error($$insert into public.plans (user_id, trainer_id, data)
  values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '{}')$$,
  '42501', '9: the former trainer cannot create plans for C');

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
do $$
declare
  n int;
begin
  assert (select status from public.coachings where id = current_setting('test.tc')::uuid) = 'ended',
    '9: the coaching is ended';
  assert (select trainer_id is null from public.plans where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '9: the plan T built is now C''s own';
  update public.plans set data = data where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics n = row_count;
  assert n = 1, '9: C can change the plan T built';
end
$$;

-- 10. Re-invite and cancel ---------------------------------------------------

select tests.login('11111111-1111-1111-1111-111111111111', 'trainer@x.test');
do $$
begin
  perform set_config('test.tc2', public.invite_client('zuzka@gmail.com')::text, false);
end
$$;
select public.cancel_invite(current_setting('test.tc2')::uuid);

select tests.login('22222222-2222-2222-2222-222222222222', 'zuzka@gmail.com');
do $$
begin
  assert (select count(*) from public.coachings
          where trainer_id = '11111111-1111-1111-1111-111111111111' and status = 'pending') = 0,
    '10: C sees no pending invite from T after he cancels it';
end
$$;
select tests.expect_error($$select public.respond_to_invite(current_setting('test.tc2')::uuid, true)$$,
  'invite_not_found', '10: C cannot accept a cancelled invite');

-- Declining: the invite disappears for C, and T2 sees it declined.
select public.respond_to_invite(current_setting('test.t2c')::uuid, false);
do $$
begin
  assert (select count(*) from public.coachings where id = current_setting('test.t2c')::uuid) = 0,
    '10: a declined invite disappears for C';
end
$$;
select tests.login('44444444-4444-4444-4444-444444444444', 'trainer2@x.test');
do $$
begin
  assert (select status from public.coachings where id = current_setting('test.t2c')::uuid) = 'declined',
    '10: T2 sees his invite declined';
end
$$;

-- 11. Anon has no access -----------------------------------------------------

-- A fresh connection, so no JWT claims are set at all.
\connect
\o /dev/null
set role anon;
do $$
begin
  assert (select count(*) from public.plans) = 0, '11: anon sees no plans';
  assert (select count(*) from public.sessions) = 0, '11: anon sees no sessions';
  assert (select count(*) from public.coachings) = 0, '11: anon sees no coachings';
end
$$;
select tests.expect_error($$select public.invite_client('someone@x.test')$$,
  '42501', '11: anon cannot invite');
select tests.expect_error($$select public.respond_to_invite(gen_random_uuid(), true)$$,
  '42501', '11: anon cannot answer invites');
select tests.expect_error($$select public.cancel_invite(gen_random_uuid())$$,
  '42501', '11: anon cannot cancel invites');
select tests.expect_error($$select public.end_coaching(gen_random_uuid())$$,
  '42501', '11: anon cannot end coachings');
select tests.expect_error($$select public.is_active_trainer_of(gen_random_uuid())$$,
  '42501', '11: anon cannot call is_active_trainer_of');
