"use client";

import { useMemo } from "react";
import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { useSession } from "@/lib/hooks";
import { BodyMapPair } from "@/components/muscles/BodyMap";
import { BodyTypeToggle } from "@/components/muscles/BodyTypeToggle";
import { useBodyType } from "@/lib/useBodyType";
import { MUSCLES, sessionLevels, type MuscleKey } from "@/lib/muscles";
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
  const [bodyType, setBodyType] = useBodyType();
  const levels = useMemo(() => (session ? sessionLevels(session) : {}), [session]);
  // busiest muscles first, for the caption under the map
  const worked = (Object.entries(levels) as [MuscleKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => MUSCLES[m].label);

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

          {worked.length > 0 && (
            <Card className="mb-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-bold">Muscles worked</span>
                <BodyTypeToggle value={bodyType} onChange={setBodyType} />
              </div>
              <div className="mx-auto max-w-[320px]">
                <BodyMapPair type={bodyType} levels={levels} size="lg" captions />
              </div>
              <p className="mt-3 text-sm text-muted">
                {worked.join(" · ")}
              </p>
              <p className="mt-1 text-xs text-muted">Deeper red = more sets.</p>
            </Card>
          )}

          <div className="flex flex-col gap-4">
            {session.exercises.map((ex) => (
              <Card key={ex.id}>
                <div className="mb-2 font-bold">{ex.name}</div>
                {ex.sets.length === 0 ? (
                  <div className="text-muted">Skipped</div>
                ) : (
                  ex.sets.map((set) => (
                    <div
                      key={set.setNumber}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted">Set {set.setNumber}</span>
                      <span className="font-semibold tabular-nums">
                        {formatWeight(set.weightKg)} kg × {set.reps}
                      </span>
                    </div>
                  ))
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
