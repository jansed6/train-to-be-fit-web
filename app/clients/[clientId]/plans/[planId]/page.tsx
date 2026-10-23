"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { PlanEditor } from "@/components/PlanEditor";
import { useClient, useClientPlans } from "@/lib/hooks";
import { clientLabel } from "@/lib/coaching";

export default function EditClientPlanPage({
  params,
}: {
  params: { clientId: string; planId: string };
}) {
  const client = useClient(params.clientId);
  const clientPlans = useClientPlans(params.clientId);
  const plan = clientPlans?.find((p) => p.id === params.planId);

  const loading = client === undefined || clientPlans === undefined;
  const clientNotFound = client === null;
  const planNotFound = !plan;

  return (
    <Container>
      <BackLink href={`/clients/${params.clientId}`}>
        {client ? clientLabel(client) : "Client"}
      </BackLink>
      <PageTitle>Edit plan</PageTitle>
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : clientNotFound ? (
        <p className="text-muted">Client not found.</p>
      ) : planNotFound ? (
        <p className="text-muted">Plan not found.</p>
      ) : (
        <PlanEditor initial={plan} clientId={params.clientId} />
      )}
    </Container>
  );
}
