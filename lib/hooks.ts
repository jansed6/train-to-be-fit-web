"use client";

import useSWR from "swr";
import {
  getAllPlans,
  getAllSessions,
  getPlan,
  getSession,
  getClientPlans,
  getClientSessions,
} from "./repo";
import { getCoachings, type Coaching } from "./coaching";
import type { Plan, WorkoutSession } from "./types";
import { useMyUserId } from "./auth";

/** All plans, newest first (undefined while loading). */
export function usePlans(): Plan[] | undefined {
  const { data } = useSWR("plans", getAllPlans);
  return data;
}

/** All sessions, newest first (undefined while loading). */
export function useSessions(): WorkoutSession[] | undefined {
  const { data } = useSWR("sessions", getAllSessions);
  return data;
}

/** A single plan: `undefined` while loading, `null` if not found. */
export function usePlan(id: string): Plan | null | undefined {
  const { data, isLoading } = useSWR(["plan", id], () => getPlan(id));
  if (isLoading) return undefined;
  return data ?? null;
}

/** A single session: `undefined` while loading, `null` if not found. */
export function useSession(id: string): WorkoutSession | null | undefined {
  const { data, isLoading } = useSWR(["session", id], () => getSession(id));
  if (isLoading) return undefined;
  return data ?? null;
}

/** Plans for a specific client (trainer view). */
export function useClientPlans(clientId: string): Plan[] | undefined {
  const { data } = useSWR(["client-plans", clientId], () => getClientPlans(clientId));
  return data;
}

/** Sessions for a specific client (trainer view). */
export function useClientSessions(clientId: string): WorkoutSession[] | undefined {
  const { data } = useSWR(["client-sessions", clientId], () => getClientSessions(clientId));
  return data;
}

/** All coachings (both as trainer and client). */
export function useCoachings(): Coaching[] | undefined {
  const { data } = useSWR("coachings", getCoachings);
  return data;
}

/** The active coaching where I'm the trainer for this client. */
export function useClient(clientId: string): Coaching | null | undefined {
  const coachings = useCoachings();
  const me = useMyUserId();
  if (!coachings || !me) return undefined;
  return coachings.find((c) => c.trainerId === me && c.clientId === clientId && c.status === "active") ?? null;
}
