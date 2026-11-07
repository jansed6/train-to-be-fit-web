import type { Session } from "@supabase/supabase-js";

// Supabase refresh tokens never expire (the dashboard's session limits are a
// paid feature), so the app ends sessions itself: after this many days without
// opening the app on a browser…
export const IDLE_LIMIT_DAYS = 14;
// …and this many days after signing in, however often it's used.
export const MAX_SESSION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryReason = "idle" | "max-age";

/** When this session signed in (ms): the earliest method in the access token's
 *  `amr` claim, which token refreshes keep, else the user's last sign-in. */
export function sessionStartedAt(session: Session): number | null {
  const fromToken = amrStartedAt(session.access_token);
  if (fromToken !== null) return fromToken;
  const last = Date.parse(session.user.last_sign_in_at ?? "");
  return Number.isNaN(last) ? null : last;
}

function amrStartedAt(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const amr: unknown = JSON.parse(atob(payload)).amr;
    if (!Array.isArray(amr)) return null;
    const times = amr
      .map((m) => m?.timestamp)
      .filter((t): t is number => typeof t === "number");
    return times.length > 0 ? Math.min(...times) * 1000 : null;
  } catch {
    return null;
  }
}

/** Whether a session that started at `startedAt` and was last used at
 *  `lastActiveAt` (both ms, null if unknown) has run out at `now`. Idle time
 *  counts from the later of the two, so a visit left over from an older
 *  sign-in on this browser doesn't make a fresh one idle. */
export function sessionExpiry(
  startedAt: number | null,
  lastActiveAt: number | null,
  now: number,
): ExpiryReason | null {
  if (startedAt !== null && now - startedAt > MAX_SESSION_DAYS * DAY_MS) {
    return "max-age";
  }
  const since = Math.max(startedAt ?? 0, lastActiveAt ?? 0);
  if (since > 0 && now - since > IDLE_LIMIT_DAYS * DAY_MS) return "idle";
  return null;
}

export function expiryMessage(reason: ExpiryReason): string {
  return reason === "idle"
    ? `You were signed out after ${IDLE_LIMIT_DAYS} days without using the app.`
    : `You were signed out — sessions end ${MAX_SESSION_DAYS} days after signing in.`;
}
