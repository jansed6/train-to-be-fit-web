"use client";

import useSWR from "swr";
import {
  getAllPlans,
  getAllSessions,
  getPlan,
  getSession,
} from "./repo";
import type { Plan, WorkoutSession } from "./types";

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
