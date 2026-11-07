"use client";

import { useState } from "react";
import { Container, PageTitle } from "@/components/ui/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { signOut, useAuth, useMyUserId } from "@/lib/auth";
import { useCoachings } from "@/lib/hooks";
import { coachingErrorMessage, endCoaching, myTrainer } from "@/lib/coaching";
import { IDLE_LIMIT_DAYS, MAX_SESSION_DAYS } from "@/lib/sessionPolicy";

export default function AccountPage() {
  const { session } = useAuth();
  const email = session?.user.email ?? "";
  const [changed, setChanged] = useState(false);

  return (
    <Container>
      <PageTitle>Account</PageTitle>
      <p className="mb-5 text-sm text-muted">{email}</p>

      <Card className="mb-4">
        <div className="mb-3 font-bold">Change password</div>
        {changed && <p className="mb-3 text-sm text-accent">Password changed.</p>}
        <NewPasswordForm email={email} onDone={() => setChanged(true)} />
      </Card>

      <TrainerCard />

      <Card>
        <div className="mb-1 font-bold">Sign out</div>
        <p className="mb-3 text-sm text-muted">
          Each device signs out by itself after {IDLE_LIMIT_DAYS} days without
          using the app, and {MAX_SESSION_DAYS} days after signing in.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
          <Button size="sm" variant="danger" onClick={() => signOut(true)}>
            Sign out on all devices
          </Button>
        </div>
      </Card>
    </Container>
  );
}

/** The client's trainer, if any. Leaving is possible but kept out of the way:
 *  the trainer normally ends the coaching from their side. */
function TrainerCard() {
  const coachings = useCoachings();
  const me = useMyUserId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainer = coachings && me ? myTrainer(coachings, me) : null;
  if (!trainer) return null;

  async function leave(id: string, trainerEmail: string) {
    const message =
      `Stop being coached by ${trainerEmail}? They'll no longer see your ` +
      "workouts, and the plans they built become yours.";
    if (!confirm(message)) return;
    setBusy(true);
    setError(null);
    try {
      await endCoaching(id);
    } catch (err) {
      setError(coachingErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4">
      <div className="mb-1 font-bold">Your trainer</div>
      <p className="mb-3 text-sm text-muted">
        {trainer.trainerEmail} builds your plans and sees your workouts.
      </p>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <Button
        size="sm"
        variant="danger"
        onClick={() => leave(trainer.id, trainer.trainerEmail)}
        disabled={busy}
      >
        Leave trainer
      </Button>
    </Card>
  );
}
