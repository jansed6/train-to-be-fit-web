"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
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
    <main className="mx-auto flex min-h-[80vh] max-w-[420px] flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full bg-[rgba(255,122,27,0.12)] px-2.5 py-0.5 text-accent">
          🐻
        </span>
        <strong className="text-lg">Train to be fit</strong>
      </div>

      <Card>
        <div className="mb-4 text-xl font-bold">
          {mode === "in" ? "Sign in" : "Create account"}
        </div>

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

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-accent">{info}</p>}

          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className={cn("mt-4 w-full text-center text-sm text-muted")}
          onClick={() => {
            setMode((m) => (m === "in" ? "up" : "in"));
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "in"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </Card>
    </main>
  );
}
