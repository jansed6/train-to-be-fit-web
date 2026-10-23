"use client";

import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { PlanEditor } from "@/components/PlanEditor";
import { usePlan } from "@/lib/hooks";

export default function EditPlanPage({ params }: { params: { id: string } }) {
  const plan = usePlan(params.id);

  return (
    <Container>
      <BackLink href="/">Home</BackLink>
      <PageTitle>Edit plan</PageTitle>
      {plan === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : plan === null ? (
        <p className="text-muted">Plan not found.</p>
      ) : plan.trainerId ? (
        <p className="text-muted">This plan is from your trainer, so only they can change it.</p>
      ) : (
        <PlanEditor initial={plan} />
      )}
    </Container>
  );
}
