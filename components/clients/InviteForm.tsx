"use client";

import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { Input, Field } from "@/components/ui/Input";
import { addClient, coachingErrorMessage, type AddClientResult } from "@/lib/coaching";

const DONE: Record<AddClientResult, (email: string) => string> = {
  added: (email) => `Added. ${email} got an email to set a password — you can build their plans now.`,
  resent: (email) => `Invite sent to ${email} again.`,
  pending: (email) => `${email} already has an account. They'll see your invite on Home.`,
  invited: (email) => `Invited. ${email} sees the invite on Home after signing in with this email.`,
};

/** Adds a client by email; closes once they're in, with what happened. */
export function InviteForm({ onClose }: { onClose: (done?: string) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    setError(null);
    try {
      const result = await addClient(email, name);
      onClose(DONE[result](email.trim()));
    } catch (err) {
      setError(coachingErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-bold">Add a client</div>
        <CloseButton onClick={() => onClose()} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={busy}
            />
          </Field>
        </div>
        <div className="mb-3">
          <Field label="Name (optional)">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>
        <p className="mb-3 text-sm text-muted">
          They get an email to set a password. You can build their plans right away.
        </p>
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy || !email}>
          {busy ? "Adding…" : "Add client"}
        </Button>
      </form>
    </Card>
  );
}
