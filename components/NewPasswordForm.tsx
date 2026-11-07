"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

// Keep in step with Supabase → Authentication → Email → Minimum password length.
export const MIN_PASSWORD_LENGTH = 8;

/** Sets the signed-in user's password (after a reset link, or from Account). */
export function NewPasswordForm({
  email,
  onDone,
}: {
  email: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== repeat) {
      setError("The passwords don’t match.");
      return;
    }
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPassword("");
    setRepeat("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/* Tells password managers which account the new password is for. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <input
        className={inputClass}
        type="password"
        placeholder="New password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={MIN_PASSWORD_LENGTH}
      />
      <input
        className={inputClass}
        type="password"
        placeholder="Repeat new password"
        autoComplete="new-password"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        required
        minLength={MIN_PASSWORD_LENGTH}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" variant="primary" block disabled={busy}>
        {busy ? "Please wait…" : "Save password"}
      </Button>
    </form>
  );
}
