import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badges";
import { requireUser } from "@/lib/supabase/server";
import { vehicleName, type DiagnosisResult, type Vehicle } from "@/lib/types";
import { deleteVehicle } from "../actions";

export default async function VehiclePage({ params }: PageProps<"/garage/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const [{ data: vehicle }, { data: diagnoses }, { data: repairs }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("diagnoses")
      .select("id, symptom, status, result, created_at")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("repairs")
      .select("id, title, path, status, created_at")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!vehicle) notFound();
  const v = vehicle as Vehicle;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/garage" className="text-sm muted">
          ‹ Garage
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{vehicleName(v)}</h1>
        <p className="muted">
          {[`${v.year} ${v.make} ${v.model}`, v.trim, v.engine, v.vin].filter(Boolean).join(" · ")}
        </p>
      </div>

      <Link href={`/diagnose/${v.id}`} className="btn-primary w-full py-4 text-base">
        Something&apos;s wrong — diagnose it
      </Link>

      <section className="space-y-3">
        <h2 className="font-semibold">Repairs</h2>
        {repairs?.length ? (
          <ul className="space-y-2">
            {repairs.map((r) => (
              <li key={r.id}>
                <Link href={`/repairs/${r.id}`} className="card flex items-center justify-between gap-3 py-3">
                  <span className="font-medium">{r.title}</span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm muted">No repairs yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Past diagnoses</h2>
        {diagnoses?.length ? (
          <ul className="space-y-2">
            {diagnoses.map((d) => (
              <li key={d.id}>
                <Link href={`/diagnoses/${d.id}`} className="card block py-3">
                  <p className="line-clamp-1 font-medium">
                    {(d.result as DiagnosisResult | null)?.causes?.[0]?.title ?? d.symptom}
                  </p>
                  <p className="line-clamp-1 text-sm muted">
                    {new Date(d.created_at).toLocaleDateString()} · {d.status === "failed" ? "Failed" : d.symptom}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm muted">No diagnoses yet.</p>
        )}
      </section>

      <form action={deleteVehicle}>
        <input type="hidden" name="id" value={v.id} />
        <button className="text-sm text-red-600">Remove this car</button>
      </form>
    </div>
  );
}
