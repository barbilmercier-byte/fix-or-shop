"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export async function finishRepair(form: FormData) {
  const { supabase } = await requireUser();
  const id = String(form.get("id"));
  const status = form.get("status") === "fixed" ? "fixed" : "not_fixed";
  const spentRaw = String(form.get("amount_spent") ?? "").replace(/[^0-9.]/g, "");
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000) || null;

  await supabase
    .from("repairs")
    .update({
      status,
      amount_spent: spentRaw ? Number(spentRaw) : null,
      notes,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/log");
  redirect("/log");
}

export async function saveSteps(id: string, stepsDone: number[]) {
  const { supabase } = await requireUser();
  await supabase.from("repairs").update({ steps_done: stepsDone }).eq("id", id);
}
