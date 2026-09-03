"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SignIn } from "./SignIn";
import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center text-muted">Loading…</div>;
  }
  if (!session) {
    return <SignIn />;
  }
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}
