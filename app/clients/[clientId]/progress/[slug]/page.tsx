"use client";

import { Container, BackLink } from "@/components/ui/layout";
import { ProgressDetail } from "@/components/progress/ProgressDetail";
import { useClient, useClientSessions } from "@/lib/hooks";
import { summaryForSlug } from "@/lib/progress";
import { clientLabel } from "@/lib/coaching";

export default function ClientProgressDetailPage({
  params,
}: {
  params: { clientId: string; slug: string };
}) {
  const client = useClient(params.clientId);
  const sessions = useClientSessions(params.clientId);
  const slug = decodeURIComponent(params.slug);
  const summary = sessions ? summaryForSlug(sessions, slug) : undefined;

  return (
    <Container>
      <BackLink href={`/clients/${params.clientId}/progress`}>
        {client ? clientLabel(client) : "Client"}
      </BackLink>
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
