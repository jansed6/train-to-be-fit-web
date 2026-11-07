"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { mutate } from "swr";
import { authRedirect, supabase } from "./supabase";
import {
  expiryMessage,
  sessionExpiry,
  sessionStartedAt,
  type ExpiryReason,
} from "./sessionPolicy";

interface AuthState {
  session: Session | null;
  loading: boolean;
  /** Signed in from a password-reset link or a trainer's invite: ask for a
   *  password before entering the app. */
  passwordSetup: "recovery" | "invite" | null;
  endPasswordSetup: () => void;
  /** Why the sign-in screen is showing, if not a plain sign-out. */
  notice: string | null;
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  passwordSetup: null,
  endPasswordSetup: () => {},
  notice: null,
});

const LAST_ACTIVE_KEY = "ttbf.lastActiveAt";

function readLastActive(): number | null {
  try {
    const at = Number(localStorage.getItem(LAST_ACTIVE_KEY));
    return at > 0 ? at : null;
  } catch {
    return null; // storage blocked — only the maximum session age applies
  }
}

function markActive(now: number) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  } catch {
    // storage blocked — see readLastActive
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordSetup, setPasswordSetup] = useState(authRedirect.passwordSetup);
  const [notice, setNotice] = useState<string | null>(authRedirect.error);
  // A workout in progress lives only in memory: never sign out under it.
  const inWorkout = useRef(false);
  inWorkout.current = (usePathname() ?? "").startsWith("/workout/");
  const expiring = useRef<ExpiryReason | null>(null);

  useEffect(() => {
    /** Signs this browser out once the session is past its limits (see
     *  sessionPolicy); otherwise counts this as a visit. */
    async function enforceLimits(s: Session | null): Promise<Session | null> {
      if (!s || inWorkout.current) return s;
      const now = Date.now();
      const reason = sessionExpiry(sessionStartedAt(s), readLastActive(), now);
      if (!reason) {
        markActive(now);
        return s;
      }
      expiring.current = reason;
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(await enforceLimits(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        // Drop the previous account's cached plans, sessions and coachings so
        // the next one signing in on this browser never sees them.
        void mutate(() => true, undefined, { revalidate: false });
        setPasswordSetup(null);
        // Only set, never cleared here: a second SIGNED_OUT (e.g. limits
        // enforced twice) mustn't wipe the reason.
        if (expiring.current) setNotice(expiryMessage(expiring.current));
        expiring.current = null;
      }
      if (event === "SIGNED_IN") setNotice(null);
      if (event === "PASSWORD_RECOVERY") setPasswordSetup("recovery");
      setSession(s);
    });
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.getSession().then(({ data }) => enforceLimits(data.session));
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        passwordSetup,
        endPasswordSetup: () => setPasswordSetup(null),
        notice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useMyUserId(): string | undefined {
  const { session } = useAuth();
  return session?.user?.id;
}

/** Signs out this browser; `everywhere` also ends the account's sessions on
 *  every other device. */
export function signOut(everywhere = false): Promise<unknown> {
  return supabase.auth.signOut({ scope: everywhere ? "global" : "local" });
}
