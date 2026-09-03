"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/layout";
import { Button } from "@/components/ui/Button";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { RestBar } from "@/components/workout/RestBar";
import { useActiveWorkout } from "@/lib/useActiveWorkout";

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
  const finishingRef = useRef(false);

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
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onChangeRow={(rowIdx, patch) => wk.updateRow(i, rowIdx, patch)}
              onConfirmRow={(rowIdx) => confirmSet(i, rowIdx)}
              onAddSet={() => wk.addSet(i)}
            />
          ))}

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
    </>
  );
}
