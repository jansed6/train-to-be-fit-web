"use client";

import { useEffect, useRef, useState } from "react";
import { getPlan, getAllSessions, saveSession, uid } from "./repo";
import { useMyUserId } from "./auth";
import { setTargets } from "./planTargets";
import { formatDuration } from "./format";
import {
  weightsFromSessions,
  prefilledRows,
  buildSession,
  isValidRow,
  type SetRow,
  type ActiveExercise,
  type WeightsByKey,
} from "./workoutRows";
import { clearDraft, isTouched, readDraft, writeDraft, type WorkoutDraft } from "./workoutDraft";
import type { Exercise } from "./types";

/** What the picker hands over when exercises are added mid-workout. */
type AddedExercise = Pick<Exercise, "name" | "catalogId" | "sets" | "reps" | "targets" | "timed">;

/** Loads a plan day. Reps and weights come from per-set targets, falling back
 *  to last time's weights (greyed). The open workout is kept in this browser
 *  (see workoutDraft) and picked up again when the page reopens. */
export function useActiveWorkout(planId: string, dayId: string) {
  const [planDayName, setPlanDayName] = useState("");
  const [exercises, setExercises] = useState<ActiveExercise[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  /** Another unfinished workout is kept in this browser; the page asks first. */
  const [otherDraft, setOtherDraft] = useState<WorkoutDraft | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Anything typed, ticked or moved yet (see WorkoutDraft.touched). */
  const [touched, setTouched] = useState(false);
  // Kept so exercises added mid-workout get the same weight prefill.
  const weightsRef = useRef<WeightsByKey>(new Map());
  // The day's Exercise[] for buildSession's plan snapshot.
  const plannedRef = useRef<Exercise[]>([]);
  // Fixed for the whole workout, so a retried save overwrites instead of duplicating.
  const sessionIdRef = useRef<string>(uid());
  // Pages only render signed in (AppShell), so this is set.
  const userId = useMyUserId();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      // Weights (per set) from the most recent session that logged each movement.
      const sessions = await getAllSessions();
      weightsRef.current = weightsFromSessions(sessions);

      const draft = readDraft();
      const mine = draft?.userId === userId ? draft : null;

      if (mine && mine.planId === planId && mine.dayId === dayId) {
        plannedRef.current = mine.planned;
        sessionIdRef.current = mine.sessionId;
        if (!cancelled) {
          setPlanDayName(mine.planDayName);
          setStartedAt(mine.startedAt);
          setTouched(isTouched(mine));
          setExercises(mine.exercises);
        }
        return;
      }

      // Another workout was only opened, never touched: this one replaces it.
      if (mine && isTouched(mine)) {
        if (!cancelled) setOtherDraft(mine);
        return;
      }

      const plan = await getPlan(planId);
      const day = plan?.days.find((d) => d.id === dayId);
      if (!day) {
        if (!cancelled) setNotFound(true);
        return;
      }
      plannedRef.current = day.exercises;

      const built: ActiveExercise[] = day.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        catalogId: ex.catalogId,
        planned: true,
        timed: ex.timed || undefined,
        targets: setTargets(ex),
        rows: prefilledRows(ex, weightsRef.current),
      }));

      if (!cancelled) {
        setPlanDayName(day.name);
        setStartedAt(Date.now());
        setExercises(built);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId, dayId, reloadKey, userId]);

  // Keep the open workout in this browser from the start (its timer is already
  // running), so leaving for another page or closing the tab can't lose it.
  useEffect(() => {
    if (!exercises || !userId) return;
    writeDraft({
      v: 1,
      userId,
      sessionId: sessionIdRef.current,
      planId,
      dayId,
      planDayName,
      startedAt,
      planned: plannedRef.current,
      exercises,
      touched,
    });
  }, [exercises, planDayName, startedAt, planId, dayId, userId, touched]);

  function updateRow(exIdx: number, rowIdx: number, patch: Partial<SetRow>) {
    setTouched(true);
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
    setTouched(true);
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
                  ...(ex.timed ? { time: last?.time ?? "" } : {}),
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
    setTouched(true);
    setExercises((exs) => {
      if (!exs || from === to || to < 0 || to >= exs.length) return exs;
      const next = [...exs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function removeExercise(exIdx: number) {
    setTouched(true);
    setExercises((exs) => (exs ? exs.filter((_ex, i) => i !== exIdx) : exs));
  }

  /** Puts a removed exercise back (undo), logged sets and all. */
  function restoreExercise(exercise: ActiveExercise, index: number) {
    setTouched(true);
    setExercises((exs) => {
      if (!exs) return exs;
      const next = [...exs];
      next.splice(Math.min(index, next.length), 0, exercise);
      return next;
    });
  }

  /** Appends exercises to this workout only — the plan itself is unchanged. */
  function addExercises(items: AddedExercise[]) {
    const added: ActiveExercise[] = items.map((it) => ({
      id: uid(),
      name: it.name,
      catalogId: it.catalogId,
      planned: false,
      timed: it.timed || undefined,
      targets: setTargets(it),
      rows: prefilledRows(it, weightsRef.current),
    }));
    setTouched(true);
    setExercises((exs) => (exs ? [...exs, ...added] : exs));
  }

  function confirm(exIdx: number, rowIdx: number) {
    const ex = exercises?.[exIdx];
    const row = ex?.rows[rowIdx];
    if (!ex || !row || !isValidRow(row, ex.timed)) return;
    updateRow(exIdx, rowIdx, { done: !row.done, prefilled: false });
  }

  /** Records a hold the set timer measured and ticks the set. */
  function completeTimedSet(exIdx: number, rowIdx: number, seconds: number) {
    updateRow(exIdx, rowIdx, { time: formatDuration(seconds), done: true, prefilled: false });
  }

  /** Saves the workout. Returns true if anything was saved; throws if the save
   *  failed (the workout stays kept in this browser, so it can be retried). */
  async function finish(): Promise<boolean> {
    if (!exercises) return false;
    const session = buildSession({
      id: sessionIdRef.current,
      planId,
      dayId,
      planDayName,
      startedAt,
      finishedAt: Date.now(),
      planned: plannedRef.current,
      exercises,
    });
    if (!session) {
      clearDraft();
      return false;
    }
    await saveSession(session);
    clearDraft();
    return true;
  }

  /** Drops this workout without saving it. */
  function discard() {
    clearDraft();
  }

  /** Drops the other unfinished workout and starts this one. */
  function discardOtherDraft() {
    clearDraft();
    setOtherDraft(null);
    setReloadKey((k) => k + 1);
  }

  return {
    planDayName,
    exercises,
    notFound,
    otherDraft,
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
    completeTimedSet,
    finish,
    discard,
    discardOtherDraft,
  };
}
