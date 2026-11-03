import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { vehicleName, type Vehicle } from "@/lib/types";
import { DiagnoseForm } from "./diagnose-form";

export default async function DiagnosePage({ params }: PageProps<"/diagnose/[vehicleId]">) {
  const { vehicleId } = await params;
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("vehicles").select("*").eq("id", vehicleId).maybeSingle();
  if (!data) notFound();
  const vehicle = data as Vehicle;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/garage/${vehicle.id}`} className="text-sm muted">
          ‹ {vehicleName(vehicle)}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">What&apos;s going on?</h1>
        <p className="muted">The more detail you give, the better the diagnosis.</p>
      </div>
      <DiagnoseForm vehicleId={vehicle.id} userId={userId} />
    </div>
  );
}
