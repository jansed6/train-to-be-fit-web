"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/layout";
import { Button } from "@/components/ui/Button";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { ExerciseCard, ExerciseCardCompact } from "@/components/workout/ExerciseCard";
import { ExerciseList } from "@/components/workout/ExerciseList";
import { UndoToast } from "@/components/workout/UndoToast";
import { RestBar } from "@/components/workout/RestBar";
import { ExercisePicker } from "@/components/plan/ExercisePicker";
import { useActiveWorkout, type ActiveExercise } from "@/lib/useActiveWorkout";

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
  const [showPicker, setShowPicker] = useState(false);
  const [removed, setRemoved] = useState<{ exercise: ActiveExercise; index: number } | null>(
    null,
  );
  const finishingRef = useRef(false);
  const closeToast = useCallback(() => setRemoved(null), []);

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
    // Guard synchronously so a fast double-tap can't save the workout twice.
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    const saved = await wk.finish();
    router.push(saved ? "/history" : "/");
  }

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-hairline bg-bg">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-2 px-4 py-3">
          <Button variant="danger" size="sm" onClick={() => router.push("/")}>
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

          <Button variant="primary" block disabled={finishing} onClick={finish}>
            {finishing ? "Saving…" : "✓ Finish workout"}
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

      {showPicker && (
        <ExercisePicker
          onAdd={wk.addExercises}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
