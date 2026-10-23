"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { ExerciseProgressList } from "@/components/progress/ExerciseProgressList";
import { useClient, useClientSessions } from "@/lib/hooks";
import { clientLabel } from "@/lib/coaching";

export default function ClientProgressPage({
  params,
}: {
  params: { clientId: string };
}) {
  const client = useClient(params.clientId);
  const sessions = useClientSessions(params.clientId);

  return (
    <Container>
      <BackLink href={`/clients/${params.clientId}`}>
        {client ? clientLabel(client) : "Client"}
      </BackLink>
      <PageTitle>Exercise progress</PageTitle>
      {sessions === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted">No workouts yet.</p>
      ) : (
        <ExerciseProgressList
          sessions={sessions}
          hrefFor={(slug) =>
            `/clients/${params.clientId}/progress/${encodeURIComponent(slug)}`
          }
        />
      )}
    </Container>
  );
}
