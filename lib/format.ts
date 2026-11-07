import type { LoggedSet, WorkoutSession } from "./types";

/** Format a weight in kg, dropping a trailing ".0". */
export function formatWeight(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** "m:ss" from seconds. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Seconds from a typed time: "45", "45 s", "1:30" (m:ss). Null when empty or
 *  not a time. */
export function parseDuration(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s*(s|sec|secs|seconds)$/, "");
  const mss = t.match(/^(\d+):(\d{1,2})$/);
  if (mss) {
    const s = Number(mss[2]);
    return s < 60 ? Number(mss[1]) * 60 + s : null;
  }
  return /^\d+$/.test(t) ? Number(t) : null;
}

/** One logged set: "25 kg × 10", or "0:45" / "10 kg · 0:45" for a timed set. */
export function formatLoggedSet(set: LoggedSet): string {
  if (set.seconds !== undefined) {
    const time = formatDuration(set.seconds);
    return set.weightKg > 0 ? `${formatWeight(set.weightKg)} kg · ${time}` : time;
  }
  return `${formatWeight(set.weightKg)} kg × ${set.reps}`;
}

/** Total volume (kg × reps) across a session. Timed sets have no reps, so
 *  they add nothing. */
export function totalVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
    0,
  );
}

/** Total logged sets across a session. */
export function totalSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

/** A readable date like "3 Sep 2026". */
export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
