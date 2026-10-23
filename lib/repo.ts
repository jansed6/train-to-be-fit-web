import { mutate } from "swr";
import { supabase } from "./supabase";
import type { Plan, WorkoutSession } from "./types";

/** A unique id (uuid when available, with a safe fallback). */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

// MARK: Plans — stored as JSONB documents in the `plans` table.

export function planFromRow(row: { data: Plan; trainer_id: string | null }): Plan {
  const plan = row.data;
  if (row.trainer_id) {
    return { ...plan, trainerId: row.trainer_id };
  }
  return plan;
}

export async function getAllPlans(): Promise<Plan[]> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from("plans")
    .select("data, trainer_id")
    .eq("user_id", me)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => planFromRow(row as { data: Plan; trainer_id: string | null }));
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  const { data, error } = await supabase
    .from("plans")
    .select("data, trainer_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return planFromRow(data as { data: Plan; trainer_id: string | null });
}

export async function savePlan(plan: Plan): Promise<void> {
  const user_id = await currentUserId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trainerId, ...planData } = plan;
  const { error } = await supabase.from("plans").upsert({
    id: plan.id,
    user_id,
    data: planData,
    created_at: new Date(plan.createdAt).toISOString(),
  });
  if (error) throw error;
  await mutate("plans");
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
  await mutate("plans");
}

export async function saveClientPlan(clientId: string, plan: Plan): Promise<void> {
  const me = await currentUserId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trainerId, ...planData } = plan;
  const { error } = await supabase.from("plans").upsert({
    id: plan.id,
    user_id: clientId,
    trainer_id: me,
    data: planData,
    created_at: new Date(plan.createdAt).toISOString(),
  });
  if (error) throw error;
  await mutate(["client-plans", clientId]);
}

export async function deleteClientPlan(clientId: string, id: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
  await mutate(["client-plans", clientId]);
}

export async function getClientPlans(clientId: string): Promise<Plan[]> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from("plans")
    .select("data, trainer_id")
    .eq("user_id", clientId)
    .eq("trainer_id", me)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => planFromRow(row as { data: Plan; trainer_id: string | null }));
}

// MARK: Sessions

export async function getAllSessions(): Promise<WorkoutSession[]> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from("sessions")
    .select("data")
    .eq("user_id", me)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as WorkoutSession);
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  const { data, error } = await supabase
    .from("sessions")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as WorkoutSession | undefined) ?? undefined;
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const user_id = await currentUserId();
  const { error } = await supabase.from("sessions").upsert({
    id: session.id,
    user_id,
    data: session,
    date: new Date(session.date).toISOString(),
  });
  if (error) throw error;
  await mutate("sessions");
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
  await mutate("sessions");
}

export async function getClientSessions(clientId: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("data")
    .eq("user_id", clientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as WorkoutSession);
}
