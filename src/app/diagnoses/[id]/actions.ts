"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { DiagnosisResult } from "@/lib/types";

export async function startRepair(form: FormData) {
  const { supabase, userId } = await requireUser();
  const diagnosisId = String(form.get("diagnosis_id"));
  const causeIndex = Number(form.get("cause_index"));
  const path = form.get("path") === "diy" ? "diy" : "shop";

  const { data: d } = await supabase
    .from("diagnoses")
    .select("id, vehicle_id, result")
    .eq("id", diagnosisId)
    .maybeSingle();
  const cause = (d?.result as DiagnosisResult | null)?.causes?.[causeIndex];
  if (!d || !cause) redirect("/garage");
  if (path === "diy" && cause.forced_shop) redirect(`/diagnoses/${diagnosisId}`);

  // Reuse an open repair for the same cause instead of creating duplicates.
  const { data: existing } = await supabase
    .from("repairs")
    .select("id")
    .eq("diagnosis_id", diagnosisId)
    .eq("cause_index", causeIndex)
    .eq("path", path)
    .eq("status", "in_progress")
    .maybeSingle();
  if (existing) redirect(`/repairs/${existing.id}`);

  const { data: repair } = await supabase
    .from("repairs")
    .insert({
      user_id: userId,
      vehicle_id: d.vehicle_id,
      diagnosis_id: d.id,
      cause_index: causeIndex,
      title: cause.title,
      path,
      shop_estimate_low: cause.shop_cost_low,
      shop_estimate_high: cause.shop_cost_high,
    })
    .select("id")
    .single();
  redirect(repair ? `/repairs/${repair.id}` : `/diagnoses/${diagnosisId}`);
}
