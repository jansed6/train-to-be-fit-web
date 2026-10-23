import type { Exercise, SetTarget } from "./types";
import { formatWeight } from "./format";

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
 * Formats per-set targets as a concise string for display.
 * Examples:
 *   - "3 × 10 · 25 kg" (all sets identical)
 *   - "12/10/8 · 20–27.5 kg" (different reps, weight range)
 *   - "2 × 8-10" (no weights)
 *   - "—" (empty)
 */
export function formatTargets(targets: SetTarget[]): string {
  if (targets.length === 0) {
    return "—";
  }

  // Rep part
  const repsDisplay = targets.map((t) => t.reps || "—");
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
