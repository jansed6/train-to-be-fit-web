"use client";

import useSWR from "swr";
import {
  getAllPlans,
  getAllSessions,
  getPlan,
  getSession,
  getClientPlans,
  getClientSessions,
  getLastClientSession,
} from "./repo";
import {
  getCoachings,
  getClientsAwaitingSignIn,
  getIsTrainer,
  myClients,
  type Coaching,
} from "./coaching";
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

/** A client's latest workout, for the client list: `null` if none yet. */
export function useLastClientSession(
  clientId: string,
): { date: number; planDayName: string } | null | undefined {
  const { data } = useSWR(["client-last-session", clientId], () =>
    getLastClientSession(clientId),
  );
  return data;
}

/** Whether I may add clients (undefined while loading). */
export function useIsTrainer(): boolean | undefined {
  const me = useMyUserId();
  const { data } = useSWR(me ? ["is-trainer", me] : null, getIsTrainer);
  return data;
}

/** Whether to show Clients: to trainers, and to anyone still coaching
 *  (e.g. no longer a trainer but with clients left). */
export function useShowsClients(): boolean {
  const isTrainer = useIsTrainer();
  const coachings = useCoachings();
  const me = useMyUserId();
  return !!isTrainer || (!!coachings && !!me && myClients(coachings, me).length > 0);
}

/** Ids of my clients who haven't signed in yet (undefined while loading). */
export function useClientsAwaitingSignIn(): Set<string> | undefined {
  const { data } = useSWR("clients-awaiting-sign-in", getClientsAwaitingSignIn);
  return data && new Set(data);
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
