"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Input";
import { MoodBear } from "@/components/MoodBear";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { cn } from "@/lib/cn";

const TITLES = { in: "Sign in", up: "Create account", reset: "Reset password" };

export function SignIn() {
  const { notice } = useAuth();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(notice);
  const [busy, setBusy] = useState(false);

  function switchTo(m: typeof mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (mode === "reset") {
      // The link signs in on this site; AuthProvider then asks for a new
      // password (the origin must be in Supabase's Redirect URLs).
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setInfo("If there’s an account for this email, a link to reset the password is on its way.");
      setMode("in");
      return;
    }

    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "up" && !data.session) {
      setInfo("Account created. Check your email to confirm, then sign in.");
      setMode("in");
    }
    // On success with a session, AuthProvider switches to the app automatically.
  }

  return (
    <AuthScreen title={TITLES[mode]}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode !== "reset" && (
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        )}
        {mode === "in" && (
          <button
            type="button"
            className="-mt-1 self-end text-sm text-muted hover:text-content"
            onClick={() => switchTo("reset")}
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}

        <Button type="submit" variant="primary" block disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "reset"
              ? "Send reset link"
              : TITLES[mode]}
        </Button>
      </form>

      <button
        type="button"
        className={cn("mt-4 w-full text-center text-sm text-muted")}
        onClick={() => switchTo(mode === "in" ? "up" : "in")}
      >
        {mode === "in"
          ? "No account? Create one"
          : mode === "up"
            ? "Already have an account? Sign in"
            : "Back to sign in"}
      </button>
    </AuthScreen>
  );
}

/** After a password-reset link: set the new password before entering the app. */
export function RecoveryScreen() {
  const { session, endRecovery } = useAuth();

  return (
    <AuthScreen title="Set a new password">
      <NewPasswordForm email={session?.user.email ?? ""} onDone={endRecovery} />
      <button
        type="button"
        className="mt-4 w-full text-center text-sm text-muted"
        onClick={endRecovery}
      >
        Skip — keep my current password
      </button>
    </AuthScreen>
  );
}

function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-[420px] flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center gap-2">
        <MoodBear mood="cheer" size={128} />
        <strong className="text-xl">Train to be fit</strong>
      </div>

      <Card>
        <div className="mb-4 text-xl font-bold">{title}</div>
        {children}
      </Card>
    </main>
  );
}
