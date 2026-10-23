"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { PlanEditor } from "@/components/PlanEditor";
import { useClient } from "@/lib/hooks";
import { clientLabel } from "@/lib/coaching";

export default function NewClientPlanPage({ params }: { params: { clientId: string } }) {
  const client = useClient(params.clientId);

  return (
    <Container>
      <BackLink href={`/clients/${params.clientId}`}>
        {client ? clientLabel(client) : "Client"}
      </BackLink>
      <PageTitle>
        {client === undefined
          ? "Loading…"
          : client === null
            ? "Client not found."
            : `New plan for ${clientLabel(client)}`}
      </PageTitle>
      {client === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : client === null ? (
        <p className="text-muted">Client not found.</p>
      ) : (
        <PlanEditor clientId={params.clientId} />
      )}
    </Container>
  );
}
