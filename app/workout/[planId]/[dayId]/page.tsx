"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/layout";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { ExerciseCard, ExerciseCardCompact } from "@/components/workout/ExerciseCard";
import { ExerciseList } from "@/components/workout/ExerciseList";
import { UndoToast } from "@/components/workout/UndoToast";
import { RestBar } from "@/components/workout/RestBar";
import { ExercisePicker } from "@/components/plan/ExercisePicker";
import { ExerciseSheet } from "@/components/muscles/ExerciseSheet";
import { useActiveWorkout } from "@/lib/useActiveWorkout";
import { uncheckedSetCount, type ActiveExercise } from "@/lib/workoutRows";
import { doneSetCount } from "@/lib/workoutDraft";

const DEFAULT_REST_SECONDS = 90;

export default function WorkoutPage({
  params,
}: {
  params: { planId: string; dayId: string };
}) {
  const router = useRouter();
  const wk = useActiveWorkout(params.planId, params.dayId);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [details, setDetails] = useState<{ name: string; catalogId?: string } | null>(null);
  const [removed, setRemoved] = useState<{ exercise: ActiveExercise; index: number } | null>(
    null,
  );
  const finishingRef = useRef(false);
  const closeToast = useCallback(() => setRemoved(null), []);
  const closeDetails = useCallback(() => setDetails(null), []);

  if (wk.notFound) {
    return (
      <Container>
        <Link href="/" className="text-accent">
          ‹ Home
        </Link>
        <p className="mt-4 text-muted">This workout day doesn’t exist.</p>
      </Container>
    );
  }

  if (wk.otherDraft) {
    const other = wk.otherDraft;
    const sets = doneSetCount(other.exercises);
    return (
      <Container>
        <Link href="/" className="text-accent">
          ‹ Home
        </Link>
        <Card className="mt-4">
          <p className="mb-0.5 font-bold">You have an unfinished workout: {other.planDayName}</p>
          <p className="mb-3 text-sm text-muted">
            {sets} {sets === 1 ? "set" : "sets"} ticked. Continue it, or discard it and start this
            one.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workout/${other.planId}/${other.dayId}`}
              className={buttonClass({ variant: "primary", size: "sm" })}
            >
              ▶ Continue {other.planDayName}
            </Link>
            <Button variant="danger" size="sm" onClick={wk.discardOtherDraft}>
              Discard it
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  if (!wk.exercises) {
    return (
      <Container>
        <p className="text-muted">Loading…</p>
      </Container>
    );
  }

  const exercises = wk.exercises;

  function confirmSet(exIdx: number, rowIdx: number) {
    const wasDone = exercises[exIdx]?.rows[rowIdx]?.done ?? false;
    wk.confirm(exIdx, rowIdx);
    // Start the rest countdown when a set is newly marked done.
    if (!wasDone) setRestEndsAt(Date.now() + DEFAULT_REST_SECONDS * 1000);
  }

  function completeTimedSet(exIdx: number, rowIdx: number, seconds: number) {
    wk.completeTimedSet(exIdx, rowIdx, seconds);
    setRestEndsAt(Date.now() + DEFAULT_REST_SECONDS * 1000);
  }

  function removeExercise(exIdx: number) {
    const exercise = exercises[exIdx];
    if (!exercise) return;
    setRemoved({ exercise, index: exIdx });
    wk.removeExercise(exIdx);
  }

  function undoRemove() {
    if (removed) wk.restoreExercise(removed.exercise, removed.index);
    setRemoved(null);
  }

  async function finish() {
    const unticked = uncheckedSetCount(exercises);
    if (unticked > 0) {
      const confirmed = window.confirm(
        `${unticked} ${unticked === 1 ? "set isn't" : "sets aren't"} ticked and won't be saved. Finish anyway?`
      );
      if (!confirmed) return;
    }
    // Guard synchronously so a fast double-tap can't save the workout twice.
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setSaveError(false);
    let saved: boolean;
    try {
      saved = await wk.finish();
    } catch {
      // Usually no signal. The workout stays on this device; let them retry.
      finishingRef.current = false;
      setFinishing(false);
      setSaveError(true);
      return;
    }
    router.push(saved ? "/history" : "/");
  }

  function quit() {
    const sets = doneSetCount(exercises);
    if (
      sets > 0 &&
      !window.confirm(
        `Quit without saving? ${sets} ticked ${sets === 1 ? "set" : "sets"} will be lost.`,
      )
    ) {
      return;
    }
    wk.discard();
    router.push("/");
  }

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-hairline bg-bg">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2 px-4 py-3">
          <Button variant="danger" size="sm" onClick={quit}>
            ✕ Quit
          </Button>
          <strong>{wk.planDayName}</strong>
          <WorkoutTimer startedAt={wk.startedAt} />
        </div>
      </div>

      <Container>
        <div className="flex flex-col gap-4">
          <ExerciseList
            items={exercises}
            renderCard={(ex, i) => (
              <ExerciseCard
                exercise={ex}
                onChangeRow={(rowIdx, patch) => wk.updateRow(i, rowIdx, patch)}
                onConfirmRow={(rowIdx) => confirmSet(i, rowIdx)}
                onAddSet={() => wk.addSet(i)}
                onShowDetails={() => setDetails({ name: ex.name, catalogId: ex.catalogId })}
                onTimerStart={() => setRestEndsAt(null)}
                onTimedSetDone={(rowIdx, seconds) => completeTimedSet(i, rowIdx, seconds)}
              />
            )}
            renderCompact={(ex, lifted) => (
              <ExerciseCardCompact exercise={ex} lifted={lifted} />
            )}
            onMove={wk.moveExercise}
            onRemove={removeExercise}
          />

          {exercises.length > 0 && (
            <p className="-mt-1 text-center text-xs text-muted">
              Hold a card to reorder · swipe left to remove
            </p>
          )}

          <Button variant="neutral" block onClick={() => setShowPicker(true)}>
            + Add exercise
          </Button>

          {saveError && (
            <p className="text-center text-sm text-red-500" role="alert">
              Couldn’t save the workout. Check your connection and try again. It’s kept on this
              device until it’s saved.
            </p>
          )}
          <Button variant="primary" block disabled={finishing} onClick={finish}>
            {finishing ? "Saving…" : saveError ? "↻ Try saving again" : "✓ Finish workout"}
          </Button>
        </div>
      </Container>

      {restEndsAt !== null && (
        <RestBar
          endsAt={restEndsAt}
          onAdd30={() => setRestEndsAt((t) => (t ?? Date.now()) + 30000)}
          onSkip={() => setRestEndsAt(null)}
          onDone={() => setRestEndsAt(null)}
        />
      )}

      {removed && (
        <UndoToast
          key={removed.exercise.id}
          message={`Removed ${removed.exercise.name}`}
          onUndo={undoRemove}
          onClose={closeToast}
        />
      )}

      {details && (
        <ExerciseSheet name={details.name} catalogId={details.catalogId} onClose={closeDetails} />
      )}

      {showPicker && (
        <ExercisePicker
          onAdd={wk.addExercises}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
