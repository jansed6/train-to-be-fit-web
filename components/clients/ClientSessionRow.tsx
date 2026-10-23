"use client";

import Link from "next/link";
import { formatDate, formatDuration } from "@/lib/format";
import { compareSession, sessionStatusLabel } from "@/lib/compare";
import type { WorkoutSession } from "@/lib/types";

export function ClientSessionRow({
  session,
  clientId,
}: {
  session: WorkoutSession;
  clientId: string;
}) {
  const comparison = compareSession(session);
  const statusText = sessionStatusLabel(comparison);

  return (
    <Link
      href={`/clients/${clientId}/workouts/${session.id}`}
      className="flex items-center justify-between gap-2 border-b border-hairline py-3 last:border-0"
    >
      <div>
        <div className="font-bold">{session.planDayName}</div>
        <div className="text-sm text-muted">
          {formatDate(session.date)} · {formatDuration(session.durationSeconds)}
        </div>
      </div>
      {statusText && (
        <div
          className={`whitespace-nowrap text-sm ${
            statusText.startsWith("✓") ? "text-green-600" : "text-orange-600"
          }`}
        >
          {statusText}
        </div>
      )}
    </Link>
  );
}
