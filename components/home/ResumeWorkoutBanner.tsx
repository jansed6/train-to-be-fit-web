"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { useMyUserId } from "@/lib/auth";
import { clearDraft, doneSetCount, readDraft, type WorkoutDraft } from "@/lib/workoutDraft";
import { formatDate } from "@/lib/format";

function startedLabel(startedAt: number): string {
  const started = new Date(startedAt);
  const time = started.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return started.toDateString() === new Date().toDateString()
    ? `started ${time}`
    : `started ${formatDate(startedAt)}, ${time}`;
}

/** Offers to continue a workout that was left unfinished in this browser. */
export function ResumeWorkoutBanner() {
  const me = useMyUserId();
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);

  // Storage is read after mount: it doesn't exist during the server render.
  useEffect(() => {
    const d = readDraft();
    setDraft(d && d.userId === me ? d : null);
  }, [me]);

  if (!draft) return null;

  const sets = doneSetCount(draft.exercises);

  function discard() {
    if (!confirm(`Discard this workout? ${sets} ticked ${sets === 1 ? "set" : "sets"} will be lost.`)) return;
    clearDraft();
    setDraft(null);
  }

  return (
    <Card className="mb-6">
      <p className="mb-0.5 font-bold">Unfinished workout: {draft.planDayName}</p>
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
