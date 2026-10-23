import { formatWeight } from "./format";
import { findCatalogExercise, normalize } from "./exerciseCatalog";
import { setTargets, repsLowerBound } from "./planTargets";
import type { Exercise, WorkoutSession, SessionExercise, LoggedSet, SetTarget } from "./types";

export interface SetRow {
  weight: string;
  reps: string;
  done: boolean;
  /** True while the weight is carried over from last time (shown greyed). */
  prefilled: boolean;
}

export interface ActiveExercise {
  id: string;
  name: string;
  catalogId?: string;
  targets: SetTarget[];
  planned: boolean;
  rows: SetRow[];
}

/** Last time's weight per set, indexed by set number - 1. A set that wasn't
 *  ticked last time leaves a gap (undefined) instead of shifting the rest. */
export type WeightsByKey = Map<string, (number | undefined)[]>;

export function parseWeight(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function isValidRow(row: SetRow): boolean {
  const w = parseWeight(row.weight);
  const r = parseInt(row.reps, 10);
  return w !== null && w >= 0 && r > 0;
}

/** Keys a movement can match on: catalogue id (if any) and the folded name.
 *  Matching on both means history saved before catalogIds existed still lines up. */
function keysFor(catalogId: string | undefined, name: string): string[] {
  const nameKey = "name:" + normalize(name);
  return catalogId ? ["id:" + catalogId, nameKey] : [nameKey];
}

/** Places logged weights by set number, so a gap stays a gap. Falls back to the
 *  position for a set without a usable number. */
function weightsBySetNumber(sets: LoggedSet[]): (number | undefined)[] {
  const weights: (number | undefined)[] = [];
  sets.forEach((set, i) => {
    const idx = Number.isInteger(set.setNumber) && set.setNumber >= 1 ? set.setNumber - 1 : i;
    if (weights[idx] === undefined) weights[idx] = set.weightKg;
  });
  return weights;
}

/** Builds a weights-by-key map from past sessions (newest first: the most recent
 *  session that logged a movement wins). */
export function weightsFromSessions(sessions: WorkoutSession[]): WeightsByKey {
  const weightsByKey: WeightsByKey = new Map();
  for (const s of sessions) {
    for (const se of s.exercises) {
      if (se.sets.length === 0) continue;
      const weights = weightsBySetNumber(se.sets);
      for (const key of keysFor(se.catalogId, se.name)) {
        if (!weightsByKey.has(key)) weightsByKey.set(key, weights);
      }
    }
  }
  return weightsByKey;
}

/** Last time's weight for set index `i`: that set's weight, else the nearest
 *  earlier set's, else the first logged one. */
function lastTimeWeight(weights: (number | undefined)[], i: number): number | undefined {
  for (let j = Math.min(i, weights.length - 1); j >= 0; j--) {
    if (weights[j] !== undefined) return weights[j];
  }
  return weights.find((w) => w !== undefined);
}

/** Rows for a fresh exercise: reps and weights from per-set targets, falling back
 *  to last time's weights. */
export function prefilledRows(
  ex: Pick<Exercise, "name" | "catalogId" | "sets" | "reps" | "targets">,
  weightsByKey: WeightsByKey,
): SetRow[] {
  const targets = setTargets(ex);
  let weights: (number | undefined)[] | undefined;
  for (const key of keysFor(ex.catalogId, ex.name)) {
    const found = weightsByKey.get(key);
    if (found) {
      weights = found;
      break;
    }
  }
  // Bodyweight moves and stretches start at 0 kg, so a set can be ticked without typing a weight.
  const catalog = findCatalogExercise(ex.catalogId, ex.name);
  const noLoad = !!catalog && (catalog.group === "Stretching" || /^bodyweight|pull-up bar|parallel bars/.test(catalog.equipment));

  return targets.map((t, i) => {
    const repsNum = repsLowerBound(t.reps);
    const reps = repsNum !== null ? String(repsNum) : "";

    // Weight decision (first match wins):
    // 1. Target has a weight
    // 2. Last time's weight for this set (or the nearest earlier / first logged one)
    // 3. No-load catalogue moves get "0"
    // 4. Otherwise empty
    const lastTime = weights ? lastTimeWeight(weights, i) : undefined;
    let weight = "";
    if (t.weightKg !== undefined) {
      weight = formatWeight(t.weightKg);
    } else if (lastTime !== undefined) {
      weight = formatWeight(lastTime);
    } else if (noLoad) {
      weight = "0";
    }

    return { weight, reps, done: false, prefilled: weight !== "" };
  });
}

/** Counts rows that aren't ticked. */
export function uncheckedSetCount(exercises: ActiveExercise[]): number {
  let count = 0;
  for (const ex of exercises) {
    for (const row of ex.rows) {
      if (!row.done) count++;
    }
  }
  return count;
}

/** Builds a session from active exercises. Returns null if nothing was ticked. */
export function buildSession(input: {
  id: string;
  planId: string;
  dayId: string;
  planDayName: string;
  startedAt: number;
  finishedAt: number;
  planned: Exercise[];
  exercises: ActiveExercise[];
}): WorkoutSession | null {
  const { id, planId, dayId, planDayName, startedAt, finishedAt, planned, exercises } = input;

  // Build a map of planned exercise ids for quick lookup
  const plannedIds = new Set(planned.map((p) => p.id));
  const processedIds = new Set<string>();

  const sessionExercises: SessionExercise[] = [];
  let hasAnySets = false;

  // Process exercises in order
  for (const ex of exercises) {
    // Only ticked sets are saved; each keeps its row's number (not its position
    // among the ticked ones) so it's compared with the planned set it belongs to.
    const sets: LoggedSet[] = ex.rows.flatMap((r, idx) =>
      r.done && isValidRow(r)
        ? [{ setNumber: idx + 1, weightKg: parseWeight(r.weight) ?? 0, reps: parseInt(r.reps, 10) }]
        : [],
    );

    if (sets.length > 0) hasAnySets = true;

    // Planned exercises are always kept
    if (ex.planned) {
      sessionExercises.push({
        id: ex.id,
        name: ex.name,
        catalogId: ex.catalogId,
        sets,
        targets: ex.targets,
      });
      processedIds.add(ex.id);
    } else if (sets.length > 0) {
      // Added exercises are kept only when they have at least one set
      sessionExercises.push({
        id: ex.id,
        name: ex.name,
        catalogId: ex.catalogId,
        sets,
        added: true,
      });
      processedIds.add(ex.id);
    }
  }

  // Append planned exercises that were missing from exercises (removed mid-workout)
  for (const p of planned) {
    if (!processedIds.has(p.id)) {
      sessionExercises.push({
        id: p.id,
        name: p.name,
        catalogId: p.catalogId,
        sets: [],
        targets: setTargets(p),
      });
    }
  }

  if (!hasAnySets) return null;

  return {
    id,
    planId,
    dayId,
    date: startedAt,
    planDayName,
    durationSeconds: Math.floor((finishedAt - startedAt) / 1000),
    exercises: sessionExercises,
  };
}
