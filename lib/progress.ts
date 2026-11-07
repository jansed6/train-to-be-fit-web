import { normalize } from "./exerciseCatalog";
import type { LoggedSet, WorkoutSession } from "./types";

export interface ProgressPoint {
  date: number;
  weight: number; // heaviest set of the session (timed: the longest set's weight)
  reps: number;
  est1RM: number; // Epley estimate (0 for timed)
  /** Timed exercises: the session's longest set, in seconds. */
  seconds?: number;
}

export interface ExerciseSummary {
  slug: string;
  name: string;
  /** Done for time: points carry `seconds`, and that's what is charted. */
  timed: boolean;
  latestWeight: number;
  latestSeconds?: number;
  sessions: number;
  points: ProgressPoint[]; // oldest first
}

/** The value a chart plots for a point: seconds for timed exercises, else the weight. */
export function plotValue(p: ProgressPoint): number {
  return p.seconds ?? p.weight;
}

function sessionPoint(date: number, sets: LoggedSet[]): ProgressPoint {
  if (sets.some((s) => s.seconds !== undefined)) {
    const longest = sets.reduce((m, s) =>
      (s.seconds ?? 0) > (m.seconds ?? 0) ||
      ((s.seconds ?? 0) === (m.seconds ?? 0) && s.weightKg > m.weightKg)
        ? s
        : m,
    );
    return { date, weight: longest.weightKg, reps: 0, est1RM: 0, seconds: longest.seconds ?? 0 };
  }
  const top = sets.reduce((m, s) => (s.weightKg > m.weightKg ? s : m), sets[0]);
  return {
    date,
    weight: top.weightKg,
    reps: top.reps,
    est1RM: top.reps > 0 ? top.weightKg * (1 + top.reps / 30) : top.weightKg,
  };
}

/** URL-safe key for an exercise: catalogue id if any, else a folded-name slug. */
export function exerciseSlug(catalogId: string | undefined, name: string): string {
  if (catalogId) return catalogId;
  return normalize(name).replace(/\s+/g, "-") || "exercise";
}

/** One summary per distinct exercise across all sessions (oldest-first points). */
export function exerciseSummaries(sessions: WorkoutSession[]): ExerciseSummary[] {
  const byDateAsc = [...sessions].sort((a, b) => a.date - b.date);
  const map = new Map<string, { name: string; points: ProgressPoint[] }>();

  for (const session of byDateAsc) {
    for (const ex of session.exercises) {
      if (ex.sets.length === 0) continue;
      const slug = exerciseSlug(ex.catalogId, ex.name);
      const point = sessionPoint(session.date, ex.sets);
      const entry = map.get(slug);
      if (entry) {
        entry.points.push(point);
        entry.name = ex.name; // keep the most recent name
      } else {
        map.set(slug, { name: ex.name, points: [point] });
      }
    }
  }

  const result: ExerciseSummary[] = [];
  for (const [slug, { name, points: all }] of map) {
    // An exercise switched between reps and time charts what it is now: the
    // sessions logged the other way don't share a scale with it.
    const timed = all[all.length - 1].seconds !== undefined;
    const points = all.filter((p) => (p.seconds !== undefined) === timed);
    const latest = points[points.length - 1];
    result.push({
      slug,
      name,
      timed,
      latestWeight: latest.weight,
      ...(timed ? { latestSeconds: latest.seconds } : {}),
      sessions: points.length,
      points,
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function summaryForSlug(
  sessions: WorkoutSession[],
  slug: string,
): ExerciseSummary | undefined {
  return exerciseSummaries(sessions).find((s) => s.slug === slug);
}

/** Index of the personal record: heaviest weight, ties broken by more reps; for
 *  timed points the longest time, ties broken by more weight. */
export function personalRecordIndex(points: ProgressPoint[]): number {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const b = points[best];
    const better =
      p.seconds !== undefined
        ? p.seconds > (b.seconds ?? 0) || (p.seconds === b.seconds && p.weight > b.weight)
        : p.weight > b.weight || (p.weight === b.weight && p.reps > b.reps);
    if (better) best = i;
  }
  return best;
}
