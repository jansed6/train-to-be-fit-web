"use client";

import { useState } from "react";
import { Container, PageTitle } from "@/components/ui/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoodBear } from "@/components/MoodBear";
import { ClientCard } from "@/components/clients/ClientCard";
import { InviteForm } from "@/components/clients/InviteForm";
import { useClientsAwaitingSignIn, useCoachings } from "@/lib/hooks";
import { useMyUserId } from "@/lib/auth";
import {
  myClients,
  myPendingInvites,
  cancelInvite,
  coachingErrorMessage,
} from "@/lib/coaching";

export default function ClientsPage() {
  const coachings = useCoachings();
  const awaitingSignIn = useClientsAwaitingSignIn();
  const me = useMyUserId();
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  if (!coachings || !me) return null;

  const clients = myClients(coachings, me);
  const pendingInvites = myPendingInvites(coachings, me);
  // A failed cancel refreshes the coachings; when the invite is gone (answered
  // elsewhere), its card is too, so show the error up top.
  const staleError =
    error && !pendingInvites.some((i) => i.id === error.id) ? error.message : null;

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
      <div className="mb-3 flex items-center justify-between gap-2">
        <PageTitle>Clients</PageTitle>
        {!adding && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAdding(true);
              setDone(null);
            }}
          >
            + Add client
          </Button>
        )}
      </div>
      {staleError && <p className="mb-4 text-sm text-red-500">{staleError}</p>}
      {done && <p className="mb-4 text-sm text-ok">{done}</p>}

      {adding && (
        <div className="mb-6">
          <InviteForm
            onClose={(message) => {
              setAdding(false);
              setDone(message ?? null);
            }}
          />
        </div>
      )}

      {clients.length === 0 && pendingInvites.length === 0 && !adding && (
        <div className="py-8 text-center text-muted">
          <div className="mb-3 flex justify-center">
            <MoodBear mood="calm" size={140} />
          </div>
          <p>No clients yet.</p>
          <p className="text-sm">
            Add a client by email: they get an invite to set a password, and you
            can build their plans and follow their workouts.
          </p>
        </div>
      )}

      {clients.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              clientId={client.clientId!}
              awaitingSignIn={awaitingSignIn?.has(client.clientId!) ?? false}
            />
          ))}
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
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {invite.clientName || invite.clientEmail}
                    </div>
                    <div className="truncate text-sm text-muted">
                      {invite.clientName ? `${invite.clientEmail} · ` : ""}
                      Has an account · waiting for them to accept
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={busy === invite.id}
                  >
                    Cancel
                  </Button>
                </div>
                {error?.id === invite.id && (
                  <p className="mt-2 text-sm text-red-500">{error.message}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
