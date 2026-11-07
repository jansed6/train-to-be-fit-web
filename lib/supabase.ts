import { createClient } from "@supabase/supabase-js";

// Configured via environment variables. For local dev put them in web/.env.local
// (see web/.env.local.example); for deployment set them in the host (e.g. Vercel).
// The publishable/anon key is a client-side key — access is enforced by
// Row-Level Security in the database.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "your-publishable-key";

/** What the email link that opened this page says — a password-reset sign-in,
 *  or why the link failed (expired, already used). Read before the client
 *  consumes the URL hash. */
export const authRedirect = readAuthRedirect();

export const supabase = createClient(url, publishableKey);

function readAuthRedirect(): { recovery: boolean; error: string | null } {
  if (typeof window === "undefined") return { recovery: false, error: null };
  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get("error_description");
  if (error) {
    // The client leaves a failed link's hash in place; drop it so a reload
    // doesn't show the error again.
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }
  return {
    recovery: params.get("type") === "recovery" && params.has("access_token"),
    error,
  };
}
