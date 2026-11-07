import { mutate } from "swr";
import { supabase } from "./supabase";

export type CoachingStatus = "pending" | "active" | "declined" | "cancelled" | "ended";

export interface Coaching {
  id: string;
  trainerId: string;
  trainerEmail: string;
  clientEmail: string;
  clientName: string | null;
  clientId: string | null;
  status: CoachingStatus;
  createdAt: number;
}

export function coachingFromRow(row: {
  id: string;
  trainer_id: string;
  trainer_email: string;
  client_email: string;
  client_name: string | null;
  client_id: string | null;
  status: CoachingStatus;
  created_at: string;
}): Coaching {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    trainerEmail: row.trainer_email,
    clientEmail: row.client_email,
    clientName: row.client_name,
    clientId: row.client_id,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function getCoachings(): Promise<Coaching[]> {
  const { data, error } = await supabase
    .from("coachings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(coachingFromRow);
}

/** Calls a coaching function and refreshes the coachings either way. On failure
 *  the invite or coaching may have changed elsewhere (cancelled, answered,
 *  ended), so the refresh drops the stale card before the error is shown. */
async function coachingRpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.rpc(fn, args);
  await mutate("coachings");
  if (error) throw error;
  return data;
}

export async function inviteClient(email: string, name: string): Promise<string> {
  return (await coachingRpc("invite_client", { p_email: email, p_name: name })) as string;
}

/** Calls the app's server route for clients (app/api/clients) as the
 *  signed-in user. */
async function clientsApi(init: { method: "GET" | "POST"; body?: object }): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  return fetch("/api/clients", {
    method: init.method,
    headers: {
      authorization: `Bearer ${data.session?.access_token ?? ""}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}

/** "added": a new account, emailed an invite to set a password (plans can be
 *  built straight away). "resent": already my client who hasn't signed in, so
 *  the invite went out again. "pending": they have an account of their own and
 *  accept the invite on Home. "invited": the same plain invite, as the server
 *  can't create accounts. */
export type AddClientResult = "added" | "resent" | "pending" | "invited";

export async function addClient(email: string, name: string): Promise<AddClientResult> {
  const res = await clientsApi({ method: "POST", body: { email, name } });
  if (res.status === 501) {
    // The server can't create accounts (no service role key): plain invite.
    await inviteClient(email, name);
    return "invited";
  }
  const json = await res.json().catch(() => ({}));
  await Promise.all([mutate("coachings"), mutate("clients-awaiting-sign-in")]);
  if (!res.ok) throw new Error(json.error ?? "");
  return json.result as AddClientResult;
}

/** Ids of my clients who haven't signed in yet (their invite is unused). */
export async function getClientsAwaitingSignIn(): Promise<string[]> {
  const res = await clientsApi({ method: "GET" });
  if (!res.ok) return [];
  return ((await res.json()).awaitingSignIn as string[] | undefined) ?? [];
}

export async function respondToInvite(id: string, accept: boolean): Promise<void> {
  await coachingRpc("respond_to_invite", { p_id: id, p_accept: accept });
}

export async function cancelInvite(id: string): Promise<void> {
  await coachingRpc("cancel_invite", { p_id: id });
}

export async function endCoaching(id: string): Promise<void> {
  await coachingRpc("end_coaching", { p_id: id });
  await mutate("plans");
}

export function clientLabel(c: Coaching): string {
  return c.clientName || c.clientEmail;
}

export function myClients(all: Coaching[], me: string): Coaching[] {
  return all.filter((c) => c.trainerId === me && c.status === "active" && c.clientId !== null);
}

export function myPendingInvites(all: Coaching[], me: string): Coaching[] {
  return all.filter((c) => c.trainerId === me && c.status === "pending");
}

export function invitesForMe(all: Coaching[], me: string): Coaching[] {
  return all.filter((c) => c.trainerId !== me && c.status === "pending");
}

export function myTrainer(all: Coaching[], me: string): Coaching | null {
  return all.find((c) => c.clientId === me && c.status === "active") ?? null;
}

export function coachingErrorMessage(err: unknown): string {
  const message = (err as { message?: string }).message;
  switch (message) {
    case "cannot_invite_self":
      return "You can't invite yourself.";
    case "already_invited":
      return "You've already added or invited this email.";
    case "rate_limited":
      return "Too many emails sent just now. Try again in a little while.";
    case "already_has_trainer":
      return "You already have a trainer. Leave them first (Account page) to accept a new one.";
    case "invalid_email":
      return "Enter a valid email.";
    case "invite_not_found":
      return "This invite is no longer available.";
    case "coaching_not_found":
      return "This coaching has already ended.";
    default:
      return "Something went wrong. Try again.";
  }
}
