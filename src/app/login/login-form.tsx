"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/garage")}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function oauth(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  if (status === "sent") {
    return (
      <div className="card">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1 text-sm muted">We sent a sign-in link to {email}. Open it on this device.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button type="button" className="btn-secondary w-full" onClick={() => oauth("google")}>
        Continue with Google
      </button>
      <button type="button" className="btn-secondary w-full" onClick={() => oauth("apple")}>
        Continue with Apple
      </button>
      <div className="flex items-center gap-3 text-xs muted">
        <span className="h-px flex-1 bg-current opacity-20" /> or <span className="h-px flex-1 bg-current opacity-20" />
      </div>
      <form onSubmit={sendLink} className="space-y-3">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button className="btn-primary w-full" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
        {status === "error" && <p className="text-sm text-red-600">{message}</p>}
      </form>
    </div>
  );
}
