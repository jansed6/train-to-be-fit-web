"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { useSessions } from "@/lib/hooks";
import {
  summaryForSlug,
  personalRecordIndex,
  type ExerciseSummary,
} from "@/lib/progress";
import { formatWeight } from "@/lib/format";

export default function ProgressPage({
  params,
}: {
  params: { slug: string };
}) {
  const sessions = useSessions();
  const slug = decodeURIComponent(params.slug);
  const summary = sessions ? summaryForSlug(sessions, slug) : undefined;

  return (
    <Container>
      <BackLink href="/history">History</BackLink>
      {sessions === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : !summary ? (
        <p className="text-muted">No data for this exercise.</p>
      ) : (
        <ProgressDetail summary={summary} />
      )}
    </Container>
  );
}

function ProgressDetail({ summary }: { summary: ExerciseSummary }) {
  const points = summary.points;
  const pr = points[personalRecordIndex(points)];
  const latest = points[points.length - 1];

  return (
    <>
      <PageTitle>{summary.name}</PageTitle>
      <Card className="mb-4">
        <ProgressChart points={points} />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <StatTile value={`${formatWeight(pr.weight)} kg`} label={`PR · ${pr.reps} reps`} />
        <StatTile value={`${formatWeight(pr.est1RM)} kg`} label="est. 1RM" />
        <StatTile value={`${formatWeight(latest.weight)} kg`} label="latest" />
        <StatTile value={points.length} label="sessions" />
      </div>
    </>
  );
}
