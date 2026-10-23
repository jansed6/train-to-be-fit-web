import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/progress/Sparkline";
import { exerciseSummaries } from "@/lib/progress";
import { formatWeight } from "@/lib/format";
import type { WorkoutSession } from "@/lib/types";

export function ExerciseProgressList({
  sessions,
  hrefFor,
}: {
  sessions: WorkoutSession[];
  hrefFor: (slug: string) => string;
}) {
  const summaries = exerciseSummaries(sessions);

  if (summaries.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Exercise progress
      </div>
      <div className="flex flex-col gap-2">
        {summaries.map((s) => (
          <Link key={s.slug} href={hrefFor(s.slug)}>
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted">
                  {formatWeight(s.latestWeight)} kg · {s.sessions} sessions
                </div>
              </div>
              <Sparkline points={s.points} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
