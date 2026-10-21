// Muscle groups shown on the body map, and helpers to work out which muscles an
// exercise (or a whole workout) trains.

import { findCatalogExercise } from "./exerciseCatalog";
import type { BodyView } from "./bodyMapData";
import type { WorkoutSession } from "./types";

export type MuscleKey =
  | "chest"
  | "abs"
  | "obliques"
  | "biceps"
  | "triceps"
  | "forearms"
  | "front-delts"
  | "rear-delts"
  | "delts"
  | "traps"
  | "upper-back"
  | "lower-back"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "adductors"
  | "calves";

/** Display name, the body-map shape it lights up, and on which views. */
export const MUSCLES: Record<MuscleKey, { label: string; slug: string; views: BodyView[] }> = {
  chest: { label: "Chest", slug: "chest", views: ["front"] },
  abs: { label: "Abs", slug: "abs", views: ["front"] },
  obliques: { label: "Obliques", slug: "obliques", views: ["front"] },
  biceps: { label: "Biceps", slug: "biceps", views: ["front"] },
  triceps: { label: "Triceps", slug: "triceps", views: ["front", "back"] },
  forearms: { label: "Forearms", slug: "forearm", views: ["front", "back"] },
  "front-delts": { label: "Front delts", slug: "deltoids", views: ["front"] },
  "rear-delts": { label: "Rear delts", slug: "deltoids", views: ["back"] },
  delts: { label: "Shoulders", slug: "deltoids", views: ["front", "back"] },
  traps: { label: "Traps", slug: "trapezius", views: ["front", "back"] },
  "upper-back": { label: "Lats & upper back", slug: "upper-back", views: ["back"] },
  "lower-back": { label: "Lower back", slug: "lower-back", views: ["back"] },
  glutes: { label: "Glutes", slug: "gluteal", views: ["back"] },
  quads: { label: "Quads", slug: "quadriceps", views: ["front"] },
  hamstrings: { label: "Hamstrings", slug: "hamstring", views: ["back"] },
  adductors: { label: "Adductors", slug: "adductors", views: ["front", "back"] },
  calves: { label: "Calves", slug: "calves", views: ["front", "back"] },
};

/** How hard each muscle works, 0..1 (1 = main muscle). */
export type MuscleLevels = Partial<Record<MuscleKey, number>>;

/** Weight of a supporting muscle relative to a main one. */
export const SECONDARY_LEVEL = 0.45;

export interface ExerciseMuscles {
  primary: MuscleKey[];
  secondary: MuscleKey[];
}

/** Muscles for an exercise from the catalogue (by id, else by name); null for unknown custom ones. */
export function musclesFor(catalogId: string | undefined, name: string): ExerciseMuscles | null {
  const ex = findCatalogExercise(catalogId, name);
  return ex ? { primary: ex.primary, secondary: ex.secondary } : null;
}

export function levelsFor(muscles: ExerciseMuscles): MuscleLevels {
  const levels: MuscleLevels = {};
  for (const m of muscles.secondary) levels[m] = SECONDARY_LEVEL;
  for (const m of muscles.primary) levels[m] = 1;
  return levels;
}

/** Workout summary: sets per muscle (supporting muscles count half), scaled so the busiest muscle is 1. */
export function sessionLevels(session: WorkoutSession): MuscleLevels {
  const load: MuscleLevels = {};
  for (const ex of session.exercises) {
    const muscles = musclesFor(ex.catalogId, ex.name);
    if (!muscles) continue;
    const sets = ex.sets.length;
    for (const m of muscles.primary) load[m] = (load[m] ?? 0) + sets;
    for (const m of muscles.secondary) load[m] = (load[m] ?? 0) + sets * 0.5;
  }
  const max = Math.max(0, ...Object.values(load).map((v) => v ?? 0));
  if (max === 0) return {};
  const levels: MuscleLevels = {};
  for (const [m, v] of Object.entries(load) as [MuscleKey, number][]) levels[m] = v / max;
  return levels;
}

/** Strongest level per body-map shape for one view. */
export function slugLevels(levels: MuscleLevels, view: BodyView): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, level] of Object.entries(levels) as [MuscleKey, number][]) {
    const { slug, views } = MUSCLES[key];
    if (views.includes(view)) out[slug] = Math.max(out[slug] ?? 0, level);
  }
  return out;
}
