import { describe, it, expect } from "vitest";
import type { Session } from "@supabase/supabase-js";
import {
  IDLE_LIMIT_DAYS,
  MAX_SESSION_DAYS,
  sessionExpiry,
  sessionStartedAt,
} from "./sessionPolicy";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 7, 12);

function token(payload: object): string {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "HS256" })}.${part(payload)}.sig`;
}

function session(accessToken: string, lastSignInAt?: string): Session {
  return {
    access_token: accessToken,
    user: { last_sign_in_at: lastSignInAt },
  } as unknown as Session;
}

describe("sessionStartedAt", () => {
  it("takes the earliest sign-in method from the token's amr claim", () => {
    const t = token({
      amr: [
        { method: "totp", timestamp: NOW / 1000 },
        { method: "password", timestamp: (NOW - DAY) / 1000 },
      ],
    });
    expect(sessionStartedAt(session(t))).toBe(NOW - DAY);
  });

  it("falls back to the user's last sign-in without an amr claim", () => {
    const lastSignIn = new Date(NOW - 2 * DAY).toISOString();
    expect(sessionStartedAt(session(token({ sub: "u1" }), lastSignIn))).toBe(NOW - 2 * DAY);
  });

  it("is null for an unreadable token and no last sign-in", () => {
    expect(sessionStartedAt(session("not-a-jwt"))).toBeNull();
  });
});

describe("sessionExpiry", () => {
  it("keeps a session used recently", () => {
    expect(sessionExpiry(NOW - 10 * DAY, NOW - DAY, NOW)).toBeNull();
  });

  it("ends a session not used for longer than the idle limit", () => {
    const last = NOW - (IDLE_LIMIT_DAYS + 1) * DAY;
    expect(sessionExpiry(last - DAY, last, NOW)).toBe("idle");
  });

  it("ignores a visit from before a fresh sign-in", () => {
    expect(sessionExpiry(NOW - 60_000, NOW - 100 * DAY, NOW)).toBeNull();
  });

  it("counts from the sign-in when there's no visit on record", () => {
    expect(sessionExpiry(NOW - (IDLE_LIMIT_DAYS + 1) * DAY, null, NOW)).toBe("idle");
  });

  it("ends a session older than the maximum even when used daily", () => {
    expect(sessionExpiry(NOW - (MAX_SESSION_DAYS + 1) * DAY, NOW - DAY, NOW)).toBe("max-age");
  });

  it("keeps a session it can't date", () => {
    expect(sessionExpiry(null, null, NOW)).toBeNull();
  });
});
