import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Uses the anon key + the signed-in user's session cookie, so every query
// through this client goes through row-level security as that user — not
// the service-role bypass that /api/leads uses. That's deliberate: the
// dashboard should only ever see what an authenticated owner is allowed to
// see under the "leads" table's RLS policies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Thrown when called from a Server Component render (cookies
            // can't be mutated there). Safe to ignore — middleware.ts is
            // what actually keeps the session refreshed.
          }
        },
      },
    },
  );
}
