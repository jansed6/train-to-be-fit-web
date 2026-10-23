"use client";

import Link from "next/link";
import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { WeekStrip } from "@/components/clients/WeekStrip";
import { ClientSessionRow } from "@/components/clients/ClientSessionRow";
import { useClient, useClientPlans, useClientSessions } from "@/lib/hooks";
import { clientLabel } from "@/lib/coaching";
import { deleteClientPlan } from "@/lib/repo";
import { startOfWeekMs, countSince, weekStrip } from "@/lib/clientStats";

export default function ClientProfilePage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const client = useClient(clientId);
  const plans = useClientPlans(clientId);
  const sessions = useClientSessions(clientId);

  if (client === null) {
    return (
      <Container>
        <p className="py-8 text-center text-muted">Client not found.</p>
      </Container>
    );
  }

  if (client === undefined || plans === undefined || sessions === undefined) {
    return null;
  }

  const now = new Date();
  const weekStart = startOfWeekMs(now);
  const last30DaysDate = new Date(now);
  last30DaysDate.setDate(last30DaysDate.getDate() - 30);
  const last30Days = last30DaysDate.getTime();

  const weekCount = countSince(sessions, weekStart);
  const monthCount = countSince(sessions, last30Days);
  const strip = weekStrip(sessions, now);

  const planNames = plans.length > 0
    ? plans.map((p) => p.name).join(" · ")
    : "No plan yet";

  return (
    <Container>
      <BackLink href="/clients">Clients</BackLink>
      <PageTitle>{clientLabel(client)}</PageTitle>
      <div className="mb-5 text-sm text-muted">{planNames}</div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile value={weekCount} label="this week" />
        <StatTile value={monthCount} label="last 30 days" />
      </div>

      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        This week
      </div>
      <div className="mb-6">
        <WeekStrip days={strip} />
      </div>

      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Plans
      </div>
      <div className="mb-6 space-y-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 font-bold">{plan.name}</div>
              <div className="flex gap-2">
                <Link
                  href={`/clients/${clientId}/plans/${plan.id}`}
                  className={buttonClass({ variant: "neutral", size: "sm" })}
                >
                  Edit
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete plan "${plan.name}"?`)) {
                      deleteClientPlan(clientId, plan.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <Link
          href={`/clients/${clientId}/plans/new`}
          className={buttonClass({ variant: "primary", size: "sm" })}
        >
          + New plan
        </Link>
      </div>

      {sessions.length > 0 && (
        <>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Workouts
          </div>
          <Card className="mb-6">
            {sessions.map((session) => (
              <ClientSessionRow
                key={session.id}
                session={session}
                clientId={clientId}
              />
            ))}
          </Card>
        </>
      )}

      <Link
        href={`/clients/${clientId}/progress`}
        className={buttonClass({ variant: "neutral", block: true })}
      >
        Exercise progress
      </Link>
    </Container>
  );
}
