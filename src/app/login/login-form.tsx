"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function friendly(message: string) {
  if (/rate limit/i.test(message)) return "Too many emails were sent. Please wait an hour, or use the last code you received.";
  if (/invalid api key/i.test(message)) return "The app's Supabase key is set up wrong (Invalid API key).";
  if (/expired|invalid/i.test(message)) return "That code is wrong or has expired. Check the newest email, or send a new one.";
  return message;
}

// Google/Apple buttons only show once enabled in Supabase and listed here, e.g. "google,apple".
const PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim())
  .filter((p): p is "google" | "apple" => p === "google" || p === "apple");

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState("");
  const supabase = createClient();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/garage";
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) {
      setStatus("idle");
      setError(friendly(error.message));
    } else {
      setStatus("sent");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("verifying");
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setStatus("sent");
      setError(friendly(error.message));
    } else {
      router.replace(safeNext);
      router.refresh();
    }
  }

  async function oauth(provider: "google" | "apple") {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) setError(friendly(error.message));
  }

  if (status === "sent" || status === "verifying") {
    return (
      <form onSubmit={verifyCode} className="card space-y-4">
        <div>
          <p className="font-semibold">Check your email</p>
          <p className="mt-1 text-sm muted">
            We sent a message to {email}. Tap the link in it, or type the code from the email here.
          </p>
        </div>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          className="input text-center text-lg tracking-widest"
          placeholder="Code from email"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={code.length < 6 || status === "verifying"}>
          {status === "verifying" ? "Checking…" : "Sign in with code"}
        </button>
        <button type="button" className="text-sm muted" onClick={() => { setStatus("idle"); setCode(""); setError(""); }}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.length > 0 && (
        <>
          {PROVIDERS.map((p) => (
            <button key={p} type="button" className="btn-secondary w-full" onClick={() => oauth(p)}>
              Continue with {p === "google" ? "Google" : "Apple"}
            </button>
          ))}
          <div className="flex items-center gap-3 text-xs muted">
            <span className="h-px flex-1 bg-current opacity-20" /> or <span className="h-px flex-1 bg-current opacity-20" />
          </div>
        </>
      )}
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
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
