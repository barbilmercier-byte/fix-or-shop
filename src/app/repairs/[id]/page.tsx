import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badges";
import { money, moneyRange } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { DiagnosisResult } from "@/lib/types";
import { FinishForm } from "./finish-form";
import { FixGuide } from "./fix-guide";

export default async function RepairPage({ params }: PageProps<"/repairs/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: repair } = await supabase
    .from("repairs")
    .select("*, diagnoses(id, result)")
    .eq("id", id)
    .maybeSingle();
  if (!repair) notFound();

  const result = (repair.diagnoses as { result: DiagnosisResult } | null)?.result;
  const cause = result?.causes?.[repair.cause_index ?? -1];
  const currency = result?.currency ?? "USD";
  const open = repair.status === "in_progress";

  return (
    <div className="space-y-6">
      <div>
        {repair.diagnosis_id && (
          <Link href={`/diagnoses/${repair.diagnosis_id}`} className="text-sm muted">‹ Diagnosis</Link>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{repair.title}</h1>
          <StatusBadge status={repair.status} />
        </div>
        <p className="muted">{repair.path === "diy" ? "Doing it yourself" : "Getting it fixed at a shop"}</p>
      </div>

      {!open && (
        <div className="card text-sm">
          <p>
            Spent: <span className="font-semibold">{money(repair.amount_spent, currency)}</span>
          </p>
          {repair.notes && <p className="mt-1 muted">{repair.notes}</p>}
        </div>
      )}

      {repair.path === "diy" && repair.diagnosis_id && repair.cause_index != null ? (
        <FixGuide
          repairId={repair.id}
          diagnosisId={repair.diagnosis_id}
          causeIndex={repair.cause_index}
          userId={userId}
          initialDone={repair.steps_done ?? []}
        />
      ) : (
        cause && (
          <section className="card space-y-3 text-sm">
            <h2 className="text-base font-semibold">Before you go to the shop</h2>
            <p>
              <span className="font-medium">A fair price is around </span>
              <span className="font-semibold">{moneyRange(cause.shop_cost_low, cause.shop_cost_high, currency)}</span>
              <span className="muted"> (typical independent shop, parts and labor; it varies by area).</span>
            </p>
            <div>
              <p className="font-medium">Tell them:</p>
              <p className="muted">{cause.explanation}</p>
            </div>
            <div>
              <p className="font-medium">Ask:</p>
              <ul className="list-disc pl-5 muted">
                <li>Can you confirm the cause before starting work?</li>
                <li>Can I get a written estimate with parts and labor listed separately?</li>
                <li>Can I have the old parts back?</li>
                <li>Is anything else on the estimate urgent, or can it wait?</li>
              </ul>
            </div>
          </section>
        )
      )}

      {open && <FinishForm id={repair.id} path={repair.path} />}
    </div>
  );
}
