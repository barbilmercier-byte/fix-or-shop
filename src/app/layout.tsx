import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fix or Shop",
  description: "Describe what's wrong with your car. Find out if you can fix it yourself, and what it costs if you can't.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ea580c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-neutral-950/80">
          <Suspense fallback={<NavShell />}>
            <Nav />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <Suspense fallback={<PageSpinner />}>{children}</Suspense>
        </main>
        <footer className="mx-auto w-full max-w-2xl px-4 pb-8 text-xs muted">
          Fix or Shop gives guidance, not a guarantee. If you are unsure, or a job involves brakes, steering,
          airbags, fuel or high-voltage parts, use a qualified mechanic.
        </footer>
      </body>
    </html>
  );
}

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-white">🔧</span>
      Fix or Shop
    </Link>
  );
}

function NavShell({ children }: { children?: React.ReactNode }) {
  return (
    <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
      {children ?? <Logo href="/" />}
    </nav>
  );
}

async function Nav() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  return (
    <NavShell>
      <Logo href={signedIn ? "/garage" : "/"} />
      {signedIn ? (
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/garage">Garage</Link>
          <Link href="/log">Repair log</Link>
          <form action="/auth/signout" method="post">
            <button className="muted">Sign out</button>
          </form>
        </div>
      ) : (
        <Link href="/login" className="text-sm font-medium">
          Sign in
        </Link>
      )}
    </NavShell>
  );
}

function PageSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
    </div>
  );
}
