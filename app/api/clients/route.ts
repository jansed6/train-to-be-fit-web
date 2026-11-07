import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// Adding a client creates their account and emails them an invite to set a
// password, so the trainer can build plans before they ever sign in. That
// takes the service role key, which only this server code sees. Without it the
// app falls back to plain invites (see addClient in lib/coaching.ts).
//
// Because it emails any address, only trainers (public.trainers, granted by
// hand) may add clients, at most DAILY_CLIENT_LIMIT a day.

export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Same as public.daily_client_limit() in supabase/schema.sql.
const DAILY_CLIENT_LIMIT = 20;
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Logs the details for Vercel's logs; the browser only gets a code. */
function serverError(what: string, err: unknown) {
  console.error(`api/clients: ${what}`, err);
  return fail("server_error", 500);
}

/** The signed-in user making the request, from their access token. */
async function caller(
  req: NextRequest,
  admin: SupabaseClient,
): Promise<{ user: User; token: string } | null> {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : { user: data.user, token };
}

/** Adds (or re-invites) a client by email. Responds with `result`: "added"
 *  (new account, invite emailed), "resent" (already this trainer's client who
 *  hasn't signed in: invite emailed again) or "pending" (has an account of
 *  their own: a plain invite to accept on Home). */
export async function POST(req: NextRequest) {
  if (!serviceKey) return fail("not_configured", 501);
  const admin = createClient(url, serviceKey, NO_SESSION);
  const me = await caller(req, admin);
  if (!me) return fail("unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  if (!EMAIL.test(email)) return fail("invalid_email");
  if (email === me.user.email?.toLowerCase()) return fail("cannot_invite_self");

  const { data: trainer, error: trainerError } = await admin
    .from("trainers")
    .select("user_id")
    .eq("user_id", me.user.id)
    .maybeSingle();
  if (trainerError) return serverError("trainer lookup", trainerError);
  if (!trainer) return fail("not_trainer", 403);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("coachings")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", me.user.id)
    .gt("created_at", since);
  if (countError) return serverError("daily count", countError);
  if ((count ?? 0) >= DAILY_CLIENT_LIMIT) return fail("rate_limited", 429);

  // Creates the account, or re-sends the invite while it's still unused. No
  // redirectTo: the link goes to the Site URL set in Supabase, never to a
  // host taken from the request.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, trainer_email: me.user.email },
  });
  if (error) {
    if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
      return invitePending(me.token, email, name);
    }
    if (error.code === "over_email_send_rate_limit") return fail("rate_limited", 429);
    return serverError("invite", error);
  }
  console.info(`api/clients: ${me.user.id} invited a client account`);

  const clientId = data.user.id;
  const { data: existing, error: lookupError } = await admin
    .from("coachings")
    .select("id")
    .eq("trainer_id", me.user.id)
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  if (lookupError) return serverError("coaching lookup", lookupError);
  if (existing) return NextResponse.json({ result: "resent" });

  const { error: insertError } = await admin.from("coachings").insert({
    trainer_id: me.user.id,
    trainer_email: me.user.email,
    client_email: email,
    client_name: name,
    client_id: clientId,
    status: "active",
  });
  // Unique violation: another trainer added them first, or this trainer has an
  // open invite for the email already — leave it to a plain invite.
  if (insertError?.code === "23505") return invitePending(me.token, email, name);
  if (insertError) return serverError("coaching insert", insertError);
  return NextResponse.json({ result: "added" });
}

/** A plain invite, made as the trainer so invite_client's checks apply. */
async function invitePending(token: string, email: string, name: string | null) {
  const asTrainer = createClient(url, publishableKey, {
    ...NO_SESSION,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { error } = await asTrainer.rpc("invite_client", { p_email: email, p_name: name ?? "" });
  // invite_client raises codes the app knows (already_invited, rate_limited…).
  if (error) return fail(error.message);
  return NextResponse.json({ result: "pending" });
}

/** The trainer's clients who haven't signed in yet (their invite is unused). */
export async function GET(req: NextRequest) {
  if (!serviceKey) return NextResponse.json({ awaitingSignIn: [] });
  const admin = createClient(url, serviceKey, NO_SESSION);
  const me = await caller(req, admin);
  if (!me) return fail("unauthorized", 401);

  const { data: rows, error } = await admin
    .from("coachings")
    .select("client_id")
    .eq("trainer_id", me.user.id)
    .eq("status", "active");
  if (error) return serverError("clients lookup", error);

  const users = await Promise.all(
    (rows ?? []).map((r) => admin.auth.admin.getUserById(r.client_id)),
  );
  const awaitingSignIn = users.flatMap(({ data }) =>
    data.user && !data.user.last_sign_in_at ? [data.user.id] : [],
  );
  return NextResponse.json({ awaitingSignIn });
}
