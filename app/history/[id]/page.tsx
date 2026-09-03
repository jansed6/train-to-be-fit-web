"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { useSession } from "@/lib/hooks";
import {
  formatDate,
  formatDuration,
  formatWeight,
  totalVolume,
} from "@/lib/format";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = useSession(params.id);

  return (
    <Container>
      <BackLink href="/history">History</BackLink>

      {session === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : session === null ? (
        <p className="text-muted">Workout not found.</p>
      ) : (
        <>
          <PageTitle>{session.planDayName}</PageTitle>

          <Card className="mb-4">
            <InfoRow label="Date" value={formatDate(session.date)} />
            <InfoRow
              label="Duration"
              value={formatDuration(session.durationSeconds)}
            />
            <InfoRow
              label="Volume"
              value={`${Math.round(totalVolume(session))} kg`}
            />
          </Card>

          <div className="flex flex-col gap-4">
            {session.exercises.map((ex) => (
              <Card key={ex.id}>
                <div className="mb-2 font-bold">{ex.name}</div>
                {ex.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted">Set {set.setNumber}</span>
                    <span className="font-semibold tabular-nums">
                      {formatWeight(set.weightKg)} kg × {set.reps}
                    </span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
