import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/garage");

  return (
    <div className="space-y-10 py-6">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Something wrong with your car?</h1>
        <p className="text-lg muted">
          Describe the problem and snap a photo. Fix or Shop tells you the likely cause, whether you can fix it
          yourself, and what you&apos;d pay a mechanic if you can&apos;t.
        </p>
        <Link href="/login" className="btn-primary text-base">
          Get started free
        </Link>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Describe it", "Noises, smells, warning lights, photos. Plain words are fine."],
          ["2. Get a verdict", "Likely causes with a clear DIY-or-shop call and real cost ranges."],
          ["3. Fix it or go", "Follow a step-by-step guide, or walk into the shop knowing the fair price."],
        ].map(([title, body]) => (
          <div key={title} className="card">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
