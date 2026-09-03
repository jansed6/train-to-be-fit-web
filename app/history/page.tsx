"use client";

import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SessionRow } from "@/components/history/SessionRow";
import { Sparkline } from "@/components/progress/Sparkline";
import { useSessions } from "@/lib/hooks";
import { exerciseSummaries } from "@/lib/progress";
import { loadSampleData } from "@/lib/sampleData";
import { formatWeight } from "@/lib/format";

export default function HistoryPage() {
  const sessions = useSessions();
  const summaries = sessions ? exerciseSummaries(sessions) : [];

  return (
    <Container>
      <PageTitle>History</PageTitle>

      {sessions === undefined ? null : sessions.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <p>No workouts yet.</p>
          <p className="text-sm">Finished workouts show up here.</p>
          <div className="mt-4">
            <Button size="sm" onClick={() => loadSampleData()}>
              Load sample data
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <StatTile value={sessions.length} label="workouts" />
          </div>

          {summaries.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Exercise progress
              </div>
              <div className="flex flex-col gap-2">
                {summaries.map((s) => (
                  <Link key={s.slug} href={`/progress/${encodeURIComponent(s.slug)}`}>
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
          )}

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Workouts
          </div>
          <div className="flex flex-col gap-4">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>

          {/* TEMPORARY: sample data for previewing the charts */}
          <div className="mt-6 text-center">
            <Button size="sm" onClick={() => loadSampleData()}>
              Load sample data
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}
