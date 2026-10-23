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
      return "You've already invited this email.";
    case "already_has_trainer":
      return "You already have a trainer. End that coaching first to accept a new one.";
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
