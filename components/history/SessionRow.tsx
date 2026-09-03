"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deleteSession } from "@/lib/repo";
import { formatDate, formatDuration, totalSets } from "@/lib/format";
import type { WorkoutSession } from "@/lib/types";

export function SessionRow({ session }: { session: WorkoutSession }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <Link href={`/history/${session.id}`} className="flex-1">
          <div className="font-bold">{session.planDayName}</div>
          <div className="text-sm text-muted">
            {formatDate(session.date)} · {formatDuration(session.durationSeconds)}{" "}
            · {totalSets(session)} sets
          </div>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Delete this workout?")) deleteSession(session.id);
          }}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
