import type { Exercise, SetTarget } from "./types";
import { formatDuration, formatWeight, parseDuration } from "./format";

/** Hold time a set gets when an exercise is switched to timed and its reps
 *  don't read as a time. */
export const DEFAULT_HOLD_SECONDS = 30;

/**
 * Returns the per-set targets for an exercise. Prefers explicit `targets` if present,
 * otherwise expands the legacy `sets`/`reps` into identical set targets.
 */
export function setTargets(ex: Pick<Exercise, "sets" | "reps" | "targets">): SetTarget[] {
  if (ex.targets) {
    return ex.targets;
  }
  const count = Math.max(1, ex.sets);
  return Array.from({ length: count }, () => ({ reps: ex.reps }));
}

/**
 * Creates an exercise update that keeps the legacy `sets`/`reps` in sync with the
 * given targets. The `sets` field is set to the target count, and `reps` is set to
 * the first set's reps.
 */
export function withTargets(targets: SetTarget[]): Pick<Exercise, "targets" | "sets" | "reps"> {
  return {
    targets,
    sets: targets.length,
    reps: targets[0]?.reps ?? "",
  };
}

/**
 * Switches targets to timed: each set gets a time (its reps if they read as one,
 * like "30 s" in older stretching plans, else the default) and keeps its weight.
 */
export function toTimedTargets(targets: SetTarget[]): SetTarget[] {
  return targets.map((t) => {
    const asTime = /\d\s*(s|sec|secs|seconds)$|:/i.test(t.reps.trim()) ? parseDuration(t.reps) : null;
    return {
      reps: "",
      seconds: t.seconds ?? (asTime && asTime > 0 ? asTime : DEFAULT_HOLD_SECONDS),
      ...(t.weightKg !== undefined ? { weightKg: t.weightKg } : {}),
    };
  });
}

/** Switches timed targets back to reps (10 a set), keeping the weights. */
export function toRepTargets(targets: SetTarget[]): SetTarget[] {
  return targets.map((t) => ({
    reps: t.reps || "10",
    ...(t.weightKg !== undefined ? { weightKg: t.weightKg } : {}),
  }));
}

/**
 * Formats per-set targets as a concise string for display.
 * Examples:
 *   - "3 × 10 · 25 kg" (all sets identical)
 *   - "12/10/8 · 20–27.5 kg" (different reps, weight range)
 *   - "2 × 8-10" (no weights)
 *   - "3 × 0:45", "0:45/0:30 · 10 kg" (timed)
 *   - "—" (empty)
 */
export function formatTargets(targets: SetTarget[]): string {
  if (targets.length === 0) {
    return "—";
  }

  // Rep (or time) part
  const timed = targets.some((t) => t.seconds !== undefined);
  const repsDisplay = targets.map((t) =>
    timed ? (t.seconds !== undefined ? formatDuration(t.seconds) : "—") : t.reps || "—",
  );
  const allRepsEqual = repsDisplay.every((r) => r === repsDisplay[0]);
  const repsPart = allRepsEqual
    ? `${targets.length} × ${repsDisplay[0]}`
    : repsDisplay.join("/");

  // Weight part
  const weights = targets.map((t) => t.weightKg).filter((w): w is number => w !== undefined);
  if (weights.length === 0) {
    return repsPart;
  }

  const allWeightsEqual = weights.every((w) => w === weights[0]);
  const weightPart = allWeightsEqual
    ? `${formatWeight(weights[0])} kg`
    : `${formatWeight(Math.min(...weights))}–${formatWeight(Math.max(...weights))} kg`;

  return `${repsPart} · ${weightPart}`;
}

/**
 * Extracts the lower bound from a rep target string.
 * Examples: "8-10" → 8, "12" → 12, "AMRAP" → null
 */
export function repsLowerBound(reps: string): number | null {
  const match = reps.trim().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
