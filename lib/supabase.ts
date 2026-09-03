import { createClient } from "@supabase/supabase-js";

// Configured via environment variables. For local dev put them in web/.env.local
// (see web/.env.local.example); for deployment set them in the host (e.g. Vercel).
// The publishable/anon key is a client-side key — access is enforced by
// Row-Level Security in the database.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "your-publishable-key";

export const supabase = createClient(url, publishableKey);
