import type { WorkoutSession, SessionExercise, LoggedSet, SetTarget } from "./types";
import { repsLowerBound } from "./planTargets";

export interface SetComparison {
  logged?: LoggedSet;
  target?: SetTarget;
  below: boolean;
}

export type ExerciseStatus = "met" | "below" | "skipped" | "added" | "untracked";

export interface ExerciseComparison {
  exercise: SessionExercise;
  status: ExerciseStatus;
  sets: SetComparison[];
}

export interface SessionComparison {
  tracked: boolean;
  exercises: ExerciseComparison[];
  skipped: number;
  below: number;
}

/**
 * Compares a workout session with the plan snapshot stored inside it.
 * For sessions saved before plan snapshots (planId undefined), all exercises
 * are marked "untracked" and the session is not judged.
 */
export function compareSession(session: WorkoutSession): SessionComparison {
  const tracked = session.planId !== undefined;

  let skipped = 0;
  let below = 0;

  const exercises = session.exercises.map((exercise): ExerciseComparison => {
    // Untracked sessions
    if (!tracked) {
      return {
        exercise,
        status: "untracked",
        sets: [],
      };
    }

    // Added exercises
    if (exercise.added) {
      return {
        exercise,
        status: "added",
        sets: [],
      };
    }

    // Skipped exercises (has targets but no logged sets)
    if (exercise.targets && exercise.sets.length === 0) {
      skipped++;
      return {
        exercise,
        status: "skipped",
        sets: [],
      };
    }

    // Planned exercises with sets
    if (exercise.targets) {
      const setComparisons = compareExerciseSets(exercise.sets, exercise.targets);
      const anyBelow = setComparisons.some((s) => s.below);

      if (anyBelow) {
        below++;
      }

      return {
        exercise,
        status: anyBelow ? "below" : "met",
        sets: setComparisons,
      };
    }

    // Exercise without targets (shouldn't happen for tracked sessions, but handle it)
    return {
      exercise,
      status: "untracked",
      sets: [],
    };
  });

  return {
    tracked,
    exercises,
    skipped,
    below,
  };
}

/**
 * Compares logged sets with target sets. Set i of the plan is compared with
 * logged set i, up to the longer of the two lists.
 */
function compareExerciseSets(loggedSets: LoggedSet[], targets: SetTarget[]): SetComparison[] {
  const maxLength = Math.max(loggedSets.length, targets.length);
  const comparisons: SetComparison[] = [];

  for (let i = 0; i < maxLength; i++) {
    const logged = loggedSets[i];
    const target = targets[i];

    if (!target) {
      // Extra logged sets beyond the plan are never below
      comparisons.push({
        logged,
        below: false,
      });
    } else if (!logged) {
      // Missing logged set for a planned set
      comparisons.push({
        target,
        below: true,
      });
    } else {
      // Compare logged set with target
      const below = isSetBelowTarget(logged, target);
      comparisons.push({
        logged,
        target,
        below,
      });
    }
  }

  return comparisons;
}

/**
 * Returns true if a logged set is below its target.
 * A set is below when:
 * - The target has a weight and the logged weight is lower, OR
 * - The target reps have a lower bound and the logged reps are lower.
 */
function isSetBelowTarget(logged: LoggedSet, target: SetTarget): boolean {
  // Check weight
  if (target.weightKg !== undefined && logged.weightKg < target.weightKg) {
    return true;
  }

  // Check reps
  const repsMin = repsLowerBound(target.reps);
  if (repsMin !== null && logged.reps < repsMin) {
    return true;
  }

  return false;
}

/**
 * Formats a session comparison as a status label for display.
 * Returns null for untracked sessions.
 */
export function sessionStatusLabel(c: SessionComparison): string | null {
  if (!c.tracked) {
    return null;
  }

  if (c.skipped === 0 && c.below === 0) {
    return "✓ All to plan";
  }

  const parts: string[] = [];

  if (c.skipped > 0) {
    parts.push(`${c.skipped} skipped`);
  }

  if (c.below > 0) {
    const belowText = parts.length === 0 ? "Below" : "below";
    parts.push(`${belowText} target on ${c.below}`);
  }

  return parts.join(" · ");
}
