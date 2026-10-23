// Core domain types. Plans and sessions are stored as whole documents (the same
// shape used in the UI) so the local v1 needs no joins; a future Supabase backend
// can map these to relational tables or JSONB.

export interface SetTarget {
  /** Rep target kept as text so ranges like "8-10" survive. */
  reps: string;
  /** Recommended weight; absent = no weight target. */
  weightKg?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  /** Rep target kept as text so ranges like "8-10" survive. */
  reps: string;
  /** Optional link to a catalogue exercise (for muscles / future how-to). */
  catalogId?: string;
  /** Per-set rep and weight targets. */
  targets?: SetTarget[];
}

export interface PlanDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface Plan {
  id: string;
  name: string;
  createdAt: number; // epoch ms
  days: PlanDay[];
  /** Filled from plans.trainer_id, never stored in data. */
  trainerId?: string;
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface SessionExercise {
  id: string;
  name: string;
  /** Optional catalogue link, so history follows the movement across renames. */
  catalogId?: string;
  sets: LoggedSet[];
  /** Per-set rep and weight targets. */
  targets?: SetTarget[];
  /** True if this exercise was added during the workout. */
  added?: boolean;
}

export interface WorkoutSession {
  id: string;
  date: number; // epoch ms
  planDayName: string;
  durationSeconds: number;
  exercises: SessionExercise[];
  /** The plan this session was started from. */
  planId?: string;
  /** The day ID within that plan. */
  dayId?: string;
}
