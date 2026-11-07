"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { WeekStrip } from "@/components/clients/WeekStrip";
import { ClientSessionRow } from "@/components/clients/ClientSessionRow";
import {
  useClient,
  useClientPlans,
  useClientSessions,
  useClientsAwaitingSignIn,
} from "@/lib/hooks";
import { addClient, clientLabel, coachingErrorMessage, endCoaching } from "@/lib/coaching";
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const awaitingSignIn = useClientsAwaitingSignIn();
  // "busy", "sent", or the error message.
  const [resend, setResend] = useState<string | null>(null);
  const router = useRouter();

  async function handleResend() {
    if (!client) return;
    setResend("busy");
    try {
      await addClient(client.clientEmail, client.clientName ?? "");
      setResend("sent");
    } catch (err) {
      setResend(coachingErrorMessage(err));
    }
  }

  async function handleEnd() {
    if (!client) return;
    const message =
      `End coaching ${clientLabel(client)}? You'll lose access to their ` +
      "workouts, and the plans you built become theirs.";
    if (!confirm(message)) return;
    setEnding(true);
    setEndError(null);
    try {
      await endCoaching(client.id);
      router.push("/clients");
    } catch (err) {
      setEndError(coachingErrorMessage(err));
      setEnding(false);
    }
  }

  async function handleDelete(planId: string, planName: string) {
    if (!confirm(`Delete plan "${planName}"?`)) return;
    setDeleting(planId);
    setDeleteFailed(false);
    try {
      await deleteClientPlan(clientId, planId);
    } catch {
      // Shown above the list: after a refresh the plan's card may be gone (e.g.
      // the client just ended the coaching).
      setDeleteFailed(true);
    } finally {
      setDeleting(null);
    }
  }

  if (client === null) {
    // Just ended here: on the way back to Clients.
    if (ending) return null;
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

      {awaitingSignIn?.has(clientId) && (
        <Card className="mb-6">
          <p className="mb-3 text-sm">
            {clientLabel(client)} hasn’t signed in yet. The invite went to{" "}
            <strong>{client.clientEmail}</strong> — you can build their plans meanwhile.
          </p>
          {resend && resend !== "busy" && (
            <p className={`mb-3 text-sm ${resend === "sent" ? "text-ok" : "text-red-500"}`}>
              {resend === "sent" ? "Invite sent again." : resend}
            </p>
          )}
          <Button size="sm" onClick={handleResend} disabled={resend === "busy" || resend === "sent"}>
            Resend invite
          </Button>
        </Card>
      )}

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
        {deleteFailed && (
          <p className="text-sm text-red-500">Couldn&apos;t delete the plan. Try again.</p>
        )}
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
                  onClick={() => handleDelete(plan.id, plan.name)}
                  disabled={deleting === plan.id}
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

      <div className="mt-10 text-center">
        {endError && <p className="mb-2 text-sm text-red-500">{endError}</p>}
        <Button variant="danger" size="sm" onClick={handleEnd} disabled={ending}>
          End coaching
        </Button>
      </div>
    </Container>
  );
}
