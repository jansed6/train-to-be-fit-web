"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { PlanEditor } from "@/components/PlanEditor";
import { useClient, usePlan } from "@/lib/hooks";
import { useMyUserId } from "@/lib/auth";
import { clientLabel } from "@/lib/coaching";

export default function EditClientPlanPage({
  params,
}: {
  params: { clientId: string; planId: string };
}) {
  const client = useClient(params.clientId);
  const plan = usePlan(params.planId);
  const me = useMyUserId();

  const loading = client === undefined || plan === undefined || me === undefined;
  const clientNotFound = client === null;
  const planNotFound = plan === null || (plan && plan.trainerId !== me);

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
