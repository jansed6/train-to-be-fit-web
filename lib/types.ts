// Core domain types. Plans and sessions are stored as whole documents (the same
// shape used in the UI) so the local v1 needs no joins; a future Supabase backend
// can map these to relational tables or JSONB.

export interface SetTarget {
  /** Rep target kept as text so ranges like "8-10" survive. Empty for a timed
   *  exercise. */
  reps: string;
  /** Recommended weight; absent = no weight target. */
  weightKg?: number;
  /** Timed exercises: how long to hold or keep going, in seconds. */
  seconds?: number;
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
  /** Done for a time (plank, stretch, bike) instead of reps: targets and
   *  logged sets carry `seconds`. */
  timed?: boolean;
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
  /** 1-based number of the set's row in the workout. Unticked sets aren't saved,
   *  so numbers can have gaps (2, 3 when set 1 wasn't done); it pairs the set
   *  with its planned set. Older sessions have contiguous numbers 1..n. */
  setNumber: number;
  weightKg: number;
  /** 0 for a timed set. */
  reps: number;
  /** Timed sets: how long it lasted, in seconds. */
  seconds?: number;
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
  /** Logged as time (sets carry `seconds`) instead of reps. */
  timed?: boolean;
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
