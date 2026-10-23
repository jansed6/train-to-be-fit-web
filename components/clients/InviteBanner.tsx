"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCoachings } from "@/lib/hooks";
import { useMyUserId } from "@/lib/auth";
import { invitesForMe, respondToInvite, coachingErrorMessage } from "@/lib/coaching";

export function InviteBanner() {
  const coachings = useCoachings();
  const me = useMyUserId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  if (!coachings || !me) return null;

  const invites = invitesForMe(coachings, me);
  if (invites.length === 0) return null;

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    setError(null);
    try {
      await respondToInvite(id, accept);
    } catch (err) {
      setError({ id, message: coachingErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      {invites.map((invite) => (
        <Card key={invite.id}>
          <p className="mb-3">
            <strong>{invite.trainerEmail}</strong> wants to be your trainer
          </p>
          {error?.id === invite.id && (
            <p className="mb-3 text-sm text-red-500">{error.message}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => respond(invite.id, true)}
              disabled={busy === invite.id}
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => respond(invite.id, false)}
              disabled={busy === invite.id}
            >
              Decline
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
