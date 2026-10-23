"use client";

import { useParams } from "next/navigation";
import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { ComparisonCard } from "@/components/clients/ComparisonCard";
import { useClient, useClientSessions } from "@/lib/hooks";
import { compareSession } from "@/lib/compare";
import { formatDate, formatDuration } from "@/lib/format";

export default function ClientWorkoutDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const sessionId = params.sessionId as string;

  const client = useClient(clientId);
  const sessions = useClientSessions(clientId);

  if (client === undefined || sessions === undefined) {
    return (
      <Container>
        <div>Loading...</div>
      </Container>
    );
  }

  if (client === null) {
    return (
      <Container>
        <div>Client not found.</div>
      </Container>
    );
  }

  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <Container>
        <BackLink href={`/clients/${clientId}`}>{client.clientName}</BackLink>
        <div>Workout not found.</div>
      </Container>
    );
  }

  const comparison = compareSession(session);

  return (
    <Container>
      <BackLink href={`/clients/${clientId}`}>{client.clientName}</BackLink>
      <PageTitle>{session.planDayName}</PageTitle>
      <div className="mb-4 text-sm text-muted">
        {formatDate(session.date)} · {formatDuration(session.durationSeconds)}
      </div>

      <div className="space-y-3">
        {comparison.exercises.map((exercise, i) => (
          <ComparisonCard key={i} comparison={exercise} />
        ))}
      </div>
    </Container>
  );
}
