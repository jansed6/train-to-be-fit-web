"use client";

import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { inviteClient, coachingErrorMessage } from "@/lib/coaching";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      await inviteClient(email, name);
      setEmail("");
      setName("");
      setSuccess(true);
    } catch (err) {
      setError(coachingErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        {success && (
          <p className="mb-3 text-sm text-green-600">
            Invite sent. It'll appear when they sign in with this email.
          </p>
        )}
        <Button type="submit" variant="primary" disabled={busy || !email}>
          Invite
        </Button>
      </form>
    </Card>
  );
}
