import { createClient } from "@supabase/supabase-js";

// Configured via environment variables. For local dev put them in web/.env.local
// (see web/.env.local.example); for deployment set them in the host (e.g. Vercel).
// The publishable/anon key is a client-side key — access is enforced by
// Row-Level Security in the database.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "your-publishable-key";

/** What the email link that opened this page says — a sign-in that needs a
 *  password set (a reset, or a trainer's invite to a new account), or why the
 *  link failed (expired, already used). Read before the client consumes the
 *  URL hash. */
export const authRedirect = readAuthRedirect();

export const supabase = createClient(url, publishableKey);

function readAuthRedirect(): {
  passwordSetup: "recovery" | "invite" | null;
  error: string | null;
} {
  if (typeof window === "undefined") return { passwordSetup: null, error: null };
  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get("error_description");
  if (error) {
    // The client leaves a failed link's hash in place; drop it so a reload
    // doesn't show the error again.
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }
  const type = params.get("type");
  return {
    passwordSetup:
      params.has("access_token") && (type === "recovery" || type === "invite") ? type : null,
    error,
  };
}
