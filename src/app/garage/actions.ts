"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

export type AddVehicleState = { error?: string };

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Decode a VIN with NHTSA's free vPIC service. Returns null if it can't be decoded. */
async function decodeVin(vin: string) {
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const r = (await res.json()).Results?.[0];
    if (!r?.ModelYear || !r?.Make || !r?.Model) return null;
    const engine = [r.DisplacementL && `${Number(r.DisplacementL).toFixed(1)}L`, r.EngineCylinders && `${r.EngineCylinders}-cyl`, r.FuelTypePrimary]
      .filter(Boolean)
      .join(" ");
    return {
      year: Number(r.ModelYear),
      make: titleCase(r.Make),
      model: r.Model as string,
      trim: (r.Trim as string) || null,
      engine: engine || null,
    };
  } catch {
    return null;
  }
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const Manual = z.object({
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(60),
});

export async function addVehicle(_prev: AddVehicleState, form: FormData): Promise<AddVehicleState> {
  const { supabase, userId } = await requireUser();
  const vin = String(form.get("vin") ?? "").trim().toUpperCase();
  const nickname = String(form.get("nickname") ?? "").trim() || null;
  const mileageRaw = String(form.get("mileage") ?? "").replace(/[^0-9]/g, "");
  const mileage = mileageRaw ? Number(mileageRaw) : null;

  let details: { year: number; make: string; model: string; trim: string | null; engine: string | null } | null = null;
  if (vin) {
    if (!VIN.test(vin)) return { error: "A VIN is 17 letters and numbers (no I, O or Q)." };
    details = await decodeVin(vin);
  }
  if (!details) {
    const parsed = Manual.safeParse({ year: form.get("year"), make: form.get("make"), model: form.get("model") });
    if (!parsed.success) {
      return { error: vin ? "We couldn't decode that VIN. Please enter year, make and model." : "Please enter year, make and model, or a VIN." };
    }
    details = { ...parsed.data, trim: null, engine: null };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ user_id: userId, vin: vin || null, nickname, mileage, ...details })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not save the car. Please try again." };

  revalidatePath("/garage");
  redirect(`/garage/${data.id}`);
}

export async function deleteVehicle(form: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("vehicles").delete().eq("id", String(form.get("id")));
  revalidatePath("/garage");
  redirect("/garage");
}
