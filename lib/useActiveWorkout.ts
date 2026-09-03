"use client";

import { useEffect, useState } from "react";
import { getPlan, getAllSessions, saveSession, uid } from "./repo";
import { formatWeight } from "./format";
import { normalize } from "./exerciseCatalog";
import type { WorkoutSession, SessionExercise, LoggedSet } from "./types";

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
  targetSets: number;
  targetReps: string;
  rows: SetRow[];
}

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

/** The first whole number in a rep target ("8-10" -> "8", "10" -> "10"). */
function firstInt(text: string): string {
  const m = text.match(/\d+/);
  return m ? m[0] : "";
}

function emptyRows(count: number): SetRow[] {
  return Array.from({ length: Math.max(count, 1) }, () => ({
    weight: "",
    reps: "",
    done: false,
    prefilled: false,
  }));
}

/** Loads a plan day. Reps come from the plan's target; weights are pre-filled
 *  (greyed) from the last workout that logged the exercise. */
export function useActiveWorkout(planId: string, dayId: string) {
  const [planDayName, setPlanDayName] = useState("");
  const [exercises, setExercises] = useState<ActiveExercise[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [current, setCurrent] = useState(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const plan = await getPlan(planId);
      const day = plan?.days.find((d) => d.id === dayId);
      if (!day) {
        if (!cancelled) setNotFound(true);
        return;
      }

      const built: ActiveExercise[] = day.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        catalogId: ex.catalogId,
        targetSets: ex.sets,
        targetReps: ex.reps,
        rows: emptyRows(ex.sets),
      }));

      // Weights (per set) from the most recent session that logged each movement.
      const sessions = await getAllSessions();
      const weightsByKey = new Map<string, number[]>();
      for (const s of sessions) {
        for (const se of s.exercises) {
          if (se.sets.length === 0) continue;
          const weights = se.sets.map((x) => x.weightKg);
          for (const key of keysFor(se.catalogId, se.name)) {
            if (!weightsByKey.has(key)) weightsByKey.set(key, weights);
          }
        }
      }

      for (const ex of built) {
        const reps = firstInt(ex.targetReps); // reps come from the plan
        let weights: number[] | undefined;
        for (const key of keysFor(ex.catalogId, ex.name)) {
          const found = weightsByKey.get(key);
          if (found) {
            weights = found;
            break;
          }
        }
        ex.rows = ex.rows.map((_row, i) => {
          const weight = weights
            ? formatWeight(weights[i] ?? weights[weights.length - 1])
            : "";
          return { weight, reps, done: false, prefilled: weight !== "" };
        });
      }

      if (!cancelled) {
        setPlanDayName(day.name);
        setExercises(built);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId, dayId]);

  function updateRow(exIdx: number, rowIdx: number, patch: Partial<SetRow>) {
    setExercises((exs) =>
      exs
        ? exs.map((ex, i) =>
            i === exIdx
              ? {
                  ...ex,
                  rows: ex.rows.map((r, j) =>
                    j === rowIdx ? { ...r, ...patch } : r,
                  ),
                }
              : ex,
          )
        : exs,
    );
  }

  function addSet(exIdx: number) {
    setExercises((exs) =>
      exs
        ? exs.map((ex, i) => {
            if (i !== exIdx) return ex;
            const last = ex.rows[ex.rows.length - 1];
            return {
              ...ex,
              rows: [
                ...ex.rows,
                {
                  weight: last?.weight ?? "",
                  reps: last?.reps ?? "",
                  done: false,
                  prefilled: false,
                },
              ],
            };
          })
        : exs,
    );
  }

  function confirm(exIdx: number, rowIdx: number) {
    const row = exercises?.[exIdx]?.rows[rowIdx];
    if (!row || !isValidRow(row)) return;
    updateRow(exIdx, rowIdx, { done: !row.done, prefilled: false });
  }

  /** Saves the workout. Returns true if anything was saved. */
  async function finish(): Promise<boolean> {
    if (!exercises) return false;
    const sessionExercises: SessionExercise[] = exercises
      .map((ex): SessionExercise => {
        const sets: LoggedSet[] = ex.rows.filter(isValidRow).map((r, idx) => ({
          setNumber: idx + 1,
          weightKg: parseWeight(r.weight) ?? 0,
          reps: parseInt(r.reps, 10),
        }));
        return { id: ex.id || uid(), name: ex.name, catalogId: ex.catalogId, sets };
      })
      .filter((se) => se.sets.length > 0);

    if (sessionExercises.length === 0) return false;

    const session: WorkoutSession = {
      id: uid(),
      date: startedAt,
      planDayName,
      durationSeconds: Math.floor((Date.now() - startedAt) / 1000),
      exercises: sessionExercises,
    };
    await saveSession(session);
    return true;
  }

  return {
    planDayName,
    exercises,
    notFound,
    current,
    setCurrent,
    startedAt,
    updateRow,
    addSet,
    confirm,
    finish,
  };
}
