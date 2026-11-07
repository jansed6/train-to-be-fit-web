"use client";

import { useState } from "react";
import { Container, PageTitle } from "@/components/ui/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { signOut, useAuth } from "@/lib/auth";
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
