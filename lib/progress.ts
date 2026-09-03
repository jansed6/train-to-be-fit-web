import { normalize } from "./exerciseCatalog";
import type { WorkoutSession } from "./types";

export interface ProgressPoint {
  date: number;
  weight: number; // heaviest set of the session
  reps: number;
  est1RM: number; // Epley estimate
}

export interface ExerciseSummary {
  slug: string;
  name: string;
  latestWeight: number;
  sessions: number;
  points: ProgressPoint[]; // oldest first
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
      const top = ex.sets.reduce((m, s) => (s.weightKg > m.weightKg ? s : m), ex.sets[0]);
      const point: ProgressPoint = {
        date: session.date,
        weight: top.weightKg,
        reps: top.reps,
        est1RM: top.reps > 0 ? top.weightKg * (1 + top.reps / 30) : top.weightKg,
      };
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
  for (const [slug, { name, points }] of map) {
    result.push({
      slug,
      name,
      latestWeight: points[points.length - 1].weight,
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

/** Index of the personal record (heaviest weight, ties broken by more reps). */
export function personalRecordIndex(points: ProgressPoint[]): number {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const b = points[best];
    if (p.weight > b.weight || (p.weight === b.weight && p.reps > b.reps)) {
      best = i;
    }
  }
  return best;
}
