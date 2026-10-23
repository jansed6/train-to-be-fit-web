"use client";

import { Container, PageTitle } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { Button } from "@/components/ui/Button";
import { SessionRow } from "@/components/history/SessionRow";
import { ExerciseProgressList } from "@/components/progress/ExerciseProgressList";
import { MoodBear } from "@/components/MoodBear";
import { useSessions } from "@/lib/hooks";
import { loadSampleData } from "@/lib/sampleData";

export default function HistoryPage() {
  const sessions = useSessions();

  return (
    <Container>
      <PageTitle>History</PageTitle>

      {sessions === undefined ? null : sessions.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <div className="mb-3 flex justify-center">
            <MoodBear mood="calm" size={140} />
          </div>
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
          <div className="mb-5 flex items-center gap-3">
            <MoodBear mood="happy" size={56} />
            <div className="flex-1">
              <StatTile value={sessions.length} label="workouts" />
            </div>
          </div>

          <ExerciseProgressList
            sessions={sessions}
            hrefFor={(slug) => `/progress/${encodeURIComponent(slug)}`}
          />

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
