import { createClient } from "@supabase/supabase-js";

/**
 * Client used only to send sign-in emails. It uses the implicit flow, so the default
 * Supabase email link returns the session in the URL and works in any browser
 * (PKCE links fail when a phone opens them in the mail app's built-in browser).
 * The session is then stored by the normal cookie-based client on /auth/link.
 */
export function createEmailLinkClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
