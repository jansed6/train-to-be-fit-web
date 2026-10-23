"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { InviteForm } from "@/components/clients/InviteForm";
import { useCoachings } from "@/lib/hooks";
import { useMyUserId } from "@/lib/auth";
import {
  myClients,
  myPendingInvites,
  myTrainer,
  cancelInvite,
  endCoaching,
  clientLabel,
  coachingErrorMessage,
  type Coaching,
} from "@/lib/coaching";

export default function ClientsPage() {
  const coachings = useCoachings();
  const me = useMyUserId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  if (!coachings || !me) return null;

  const trainer = myTrainer(coachings, me);
  const clients = myClients(coachings, me);
  const pendingInvites = myPendingInvites(coachings, me);
  // A failed action refreshes the coachings; when the card it came from is
  // gone (the invite or coaching changed elsewhere), show the error up top.
  const cardIds = new Set([
    ...(trainer ? [trainer.id] : []),
    ...clients.map((c) => c.id),
    ...pendingInvites.map((c) => c.id),
  ]);
  const staleError = error && !cardIds.has(error.id) ? error.message : null;

  async function handleEndCoaching(id: string, confirmMessage: string) {
    if (!confirm(confirmMessage)) return;

    setBusy(id);
    setError(null);
    try {
      await endCoaching(id);
    } catch (err) {
      setError({ id, message: coachingErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function handleCancelInvite(id: string) {
    setBusy(id);
    setError(null);
    try {
      await cancelInvite(id);
    } catch (err) {
      setError({ id, message: coachingErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Container>
      <PageTitle>Clients</PageTitle>
      {staleError && <p className="mb-4 text-sm text-red-500">{staleError}</p>}

      {trainer && (
        <div className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Your trainer
          </div>
          <Card>
            <div className="mb-3">
              <strong>{trainer.trainerEmail}</strong>
            </div>
            {error?.id === trainer.id && (
              <p className="mb-3 text-sm text-red-500">{error.message}</p>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                handleEndCoaching(
                  trainer.id,
                  `Stop being coached by ${trainer.trainerEmail}?`
                )
              }
              disabled={busy === trainer.id}
            >
              End coaching
            </Button>
          </Card>
        </div>
      )}

      <div className="mb-6">
        <InviteForm />
      </div>

      {clients.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Clients
          </div>
          <div className="flex flex-col gap-2">
            {clients.map((client) => (
              <Card key={client.id}>
                <div className="mb-3">
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {clientLabel(client)}
                  </Link>
                </div>
                {error?.id === client.id && (
                  <p className="mb-3 text-sm text-red-500">{error.message}</p>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    handleEndCoaching(
                      client.id,
                      `End coaching ${clientLabel(client)}? You'll lose access to their workouts.`
                    )
                  }
                  disabled={busy === client.id}
                >
                  End
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Pending invites
          </div>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id}>
                <div className="mb-3">
                  <strong>{invite.clientEmail}</strong>
                  {invite.clientName && (
                    <span className="ml-1 text-muted">({invite.clientName})</span>
                  )}
                </div>
                {error?.id === invite.id && (
                  <p className="mb-3 text-sm text-red-500">{error.message}</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvite(invite.id)}
                  disabled={busy === invite.id}
                >
                  Cancel
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
