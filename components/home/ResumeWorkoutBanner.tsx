"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { clearDraft, doneSetCount } from "@/lib/workoutDraft";
import { useWorkoutDraft } from "@/lib/useWorkoutDraft";
import { formatDate } from "@/lib/format";

function startedLabel(startedAt: number): string {
  const started = new Date(startedAt);
  const time = started.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return started.toDateString() === new Date().toDateString()
    ? `started ${time}`
    : `started ${formatDate(startedAt)}, ${time}`;
}

/** Offers to continue (or drop) the workout in progress in this browser. */
export function ResumeWorkoutBanner() {
  const draft = useWorkoutDraft();
  if (!draft) return null;

  const sets = doneSetCount(draft.exercises);

  function discard() {
    if (
      sets > 0 &&
      !window.confirm(`Discard this workout? ${sets} ticked ${sets === 1 ? "set" : "sets"} will be lost.`)
    ) {
      return;
    }
    clearDraft();
  }

  return (
    <Card className="mb-6">
      <p className="mb-0.5 font-bold">Workout in progress: {draft.planDayName}</p>
      <p className="mb-3 text-sm text-muted">
        {startedLabel(draft.startedAt)} · {sets} {sets === 1 ? "set" : "sets"} ticked
      </p>
      <div className="flex gap-2">
        <Link
          href={`/workout/${draft.planId}/${draft.dayId}`}
          className={buttonClass({ variant: "primary", size: "sm" })}
        >
          ▶ Continue
        </Link>
        <Button variant="danger" size="sm" onClick={discard}>
          Discard
        </Button>
      </div>
    </Card>
  );
}
