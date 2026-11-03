import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { vehicleName, type Vehicle } from "@/lib/types";
import { AddVehicleForm } from "./add-vehicle-form";

export default async function GaragePage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select("*").order("created_at");
  const vehicles = (data ?? []) as Vehicle[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My garage</h1>
        <p className="muted">Pick a car to diagnose a problem.</p>
      </div>
      <ul className="space-y-3">
        {vehicles.map((v) => (
          <li key={v.id}>
            <Link href={`/garage/${v.id}`} className="card flex items-center justify-between hover:border-orange-400">
              <div>
                <p className="font-semibold">{vehicleName(v)}</p>
                <p className="text-sm muted">
                  {[v.nickname && `${v.year} ${v.make} ${v.model}`, v.engine, v.mileage && `${v.mileage.toLocaleString()} mi`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span aria-hidden className="text-xl muted">›</span>
            </Link>
          </li>
        ))}
      </ul>
      <AddVehicleForm startOpen={vehicles.length === 0} />
    </div>
  );
}
