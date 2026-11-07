// The workout in progress, kept in this browser's storage so a reload, a closed
// tab or the phone suspending the browser doesn't lose it. One slot per browser:
// it holds the latest workout with at least one ticked set, and is cleared when
// that workout is saved or discarded.

import type { ActiveExercise } from "./workoutRows";
import type { Exercise } from "./types";

export interface WorkoutDraft {
  v: 1;
  /** Whose workout it is: another account on this browser never sees it. */
  userId: string;
  /** The id the session is saved under, so retrying a save can't duplicate it. */
  sessionId: string;
  planId: string;
  dayId: string;
  planDayName: string;
  startedAt: number;
  /** The day's planned exercises when the workout started (the plan snapshot). */
  planned: Exercise[];
  exercises: ActiveExercise[];
}

const KEY = "ttbf.activeWorkout";

/** Parses stored text into a draft; anything malformed reads as no draft. */
export function parseDraft(raw: string | null): WorkoutDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (
      d?.v === 1 &&
      typeof d.userId === "string" &&
      typeof d.sessionId === "string" &&
      typeof d.planId === "string" &&
      typeof d.dayId === "string" &&
      typeof d.planDayName === "string" &&
      typeof d.startedAt === "number" &&
      Array.isArray(d.planned) &&
      Array.isArray(d.exercises) &&
      d.exercises.every((ex: unknown) => Array.isArray((ex as ActiveExercise)?.rows))
    ) {
      return d as WorkoutDraft;
    }
  } catch {
    // not JSON
  }
  return null;
}

export function readDraft(): WorkoutDraft | null {
  try {
    return parseDraft(localStorage.getItem(KEY));
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

export function writeDraft(draft: WorkoutDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage blocked or full: the workout still works, it just isn't kept
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage blocked
  }
}

/** Ticked sets across the workout. */
export function doneSetCount(exercises: ActiveExercise[]): number {
  return exercises.reduce((n, ex) => n + ex.rows.filter((r) => r.done).length, 0);
}
