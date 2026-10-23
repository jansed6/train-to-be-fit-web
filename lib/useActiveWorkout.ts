"use client";

import { useEffect, useRef, useState } from "react";
import { getPlan, getAllSessions, saveSession, uid } from "./repo";
import { setTargets } from "./planTargets";
import {
  weightsFromSessions,
  prefilledRows,
  buildSession,
  isValidRow,
  type SetRow,
  type ActiveExercise,
  type WeightsByKey,
} from "./workoutRows";
import type { Exercise } from "./types";

/** Loads a plan day. Reps and weights come from per-set targets, falling back
 *  to last time's weights (greyed). */
export function useActiveWorkout(planId: string, dayId: string) {
  const [planDayName, setPlanDayName] = useState("");
  const [exercises, setExercises] = useState<ActiveExercise[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [current, setCurrent] = useState(0);
  const [startedAt] = useState(() => Date.now());
  // Kept so exercises added mid-workout get the same weight prefill.
  const weightsRef = useRef<WeightsByKey>(new Map());
  // The day's Exercise[] for buildSession's plan snapshot.
  const plannedRef = useRef<Exercise[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const plan = await getPlan(planId);
      const day = plan?.days.find((d) => d.id === dayId);
      if (!day) {
        if (!cancelled) setNotFound(true);
        return;
      }

      // Weights (per set) from the most recent session that logged each movement.
      const sessions = await getAllSessions();
      const weightsByKey = weightsFromSessions(sessions);
      weightsRef.current = weightsByKey;
      plannedRef.current = day.exercises;

      const built: ActiveExercise[] = day.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        catalogId: ex.catalogId,
        planned: true,
        targets: setTargets(ex),
        rows: prefilledRows(ex, weightsByKey),
      }));

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

  /** Moves the exercise at `from` so it ends up at index `to`. */
  function moveExercise(from: number, to: number) {
    setExercises((exs) => {
      if (!exs || from === to || to < 0 || to >= exs.length) return exs;
      const next = [...exs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function removeExercise(exIdx: number) {
    setExercises((exs) => (exs ? exs.filter((_ex, i) => i !== exIdx) : exs));
  }

  /** Puts a removed exercise back (undo), logged sets and all. */
  function restoreExercise(exercise: ActiveExercise, index: number) {
    setExercises((exs) => {
      if (!exs) return exs;
      const next = [...exs];
      next.splice(Math.min(index, next.length), 0, exercise);
      return next;
    });
  }

  /** Appends exercises to this workout only — the plan itself is unchanged. */
  function addExercises(
    items: Pick<Exercise, "name" | "catalogId" | "sets" | "reps">[],
  ) {
    const added: ActiveExercise[] = items.map((it) => ({
      id: uid(),
      name: it.name,
      catalogId: it.catalogId,
      planned: false,
      targets: setTargets(it),
      rows: prefilledRows(it, weightsRef.current),
    }));
    setExercises((exs) => (exs ? [...exs, ...added] : exs));
  }

  function confirm(exIdx: number, rowIdx: number) {
    const row = exercises?.[exIdx]?.rows[rowIdx];
    if (!row || !isValidRow(row)) return;
    updateRow(exIdx, rowIdx, { done: !row.done, prefilled: false });
  }

  /** Saves the workout. Returns true if anything was saved. */
  async function finish(): Promise<boolean> {
    if (!exercises) return false;
    const session = buildSession({
      id: uid(),
      planId,
      dayId,
      planDayName,
      startedAt,
      finishedAt: Date.now(),
      planned: plannedRef.current,
      exercises,
    });
    if (!session) return false;
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
    moveExercise,
    removeExercise,
    restoreExercise,
    addExercises,
    confirm,
    finish,
  };
}
