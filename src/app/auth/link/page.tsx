"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Landing page for email sign-in links: reads the session from the URL and saves it. */
export default function EmailLinkPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const nextParam = query.get("next") ?? "/garage";
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/garage";

    const failure = hash.get("error_description") ?? query.get("error_description");
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (failure || !accessToken || !refreshToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL
      setError(failure?.replace(/\+/g, " ") ?? "This sign-in link is incomplete or was already used.");
      return;
    }
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) setError(error.message);
        else {
          router.replace(next);
          router.refresh();
        }
      });
  }, [router]);

  return (
    <div className="mx-auto max-w-sm py-12 text-center">
      {error ? (
        <div className="card space-y-3">
          <p className="font-semibold">That sign-in link didn&apos;t work</p>
          <p className="text-sm muted">{error}</p>
          <Link href="/login" className="btn-primary w-full">
            Send a new link
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
          <p className="muted">Signing you in…</p>
        </div>
      )}
    </div>
  );
}
