import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth (Google/Apple) and PKCE email-link return URL. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/garage";
  // Only allow same-site relative redirects.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/garage";

  let reason = searchParams.get("error_description") ?? "That sign-in link didn't work.";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    reason = /code verifier/i.test(error.message)
      ? "The link opened in a different browser from the one you signed in on. Use the code from the email instead."
      : error.message;
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
}
