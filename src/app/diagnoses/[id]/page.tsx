import Link from "next/link";
import { notFound } from "next/navigation";
import { VerdictBadge } from "@/components/badges";
import { money, moneyRange, partsTotal } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { vehicleName, type Cause, type DiagnosisResult, type Recall, type Vehicle } from "@/lib/types";
import { startRepair } from "./actions";

const DRIVE = {
  yes: ["Safe to drive", "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-900"],
  with_caution: ["Drive carefully, and not far", "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900"],
  no: ["Don't drive it", "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-900"],
} as const;

export default async function DiagnosisPage({ params }: PageProps<"/diagnoses/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("diagnoses")
    .select("id, symptom, status, error, result, recalls, created_at, vehicles(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const vehicle = data.vehicles as unknown as Vehicle;

  if (data.status !== "done" || !data.result) {
    return (
      <div className="card space-y-3">
        <h1 className="text-xl font-bold">This diagnosis didn&apos;t finish</h1>
        <p className="muted">{data.error ?? "Please try again."}</p>
        <Link href={`/diagnose/${vehicle.id}`} className="btn-primary">
          Try again
        </Link>
      </div>
    );
  }

  const result = data.result as DiagnosisResult;
  const recalls = (data.recalls ?? []) as Recall[];
  const [driveLabel, driveCls] = DRIVE[result.safe_to_drive];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/garage/${vehicle.id}`} className="text-sm muted">
          ‹ {vehicleName(vehicle)}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Diagnosis</h1>
        <p className="mt-1 text-sm muted">&ldquo;{data.symptom}&rdquo;</p>
      </div>

      <div className={`rounded-2xl border p-4 ${driveCls}`}>
        <p className="font-semibold">{driveLabel}</p>
        <p className="text-sm">{result.safety_note}</p>
      </div>

      <p>{result.summary}</p>

      <section className="space-y-4">
        <h2 className="font-semibold">Most likely causes</h2>
        {result.causes.map((c, i) => (
          <CauseCard key={i} cause={c} index={i} diagnosisId={data.id} currency={result.currency} />
        ))}
      </section>

      {result.questions_to_narrow_down.length > 0 && (
        <section className="card space-y-2">
          <h2 className="font-semibold">To narrow it down</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {result.questions_to_narrow_down.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <Link href={`/diagnose/${vehicle.id}`} className="text-sm font-semibold text-orange-600">
            Add these details and diagnose again ›
          </Link>
        </section>
      )}

      {recalls.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Safety recalls for this model ({recalls.length})</h2>
          <p className="text-sm muted">
            Recall repairs are free at a dealer. Check whether yours has been done with your VIN at nhtsa.gov/recalls.
          </p>
          <ul className="space-y-3 text-sm">
            {recalls.map((r) => (
              <li key={r.campaign}>
                <p className="font-medium">{r.component}</p>
                <p className="line-clamp-3 muted">{r.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CauseCard({ cause, index, diagnosisId, currency }: { cause: Cause; index: number; diagnosisId: string; currency: string }) {
  const parts = partsTotal(cause.parts);
  const saving = Math.max(0, cause.shop_cost_low - parts.high);
  return (
    <article className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide muted">{cause.likelihood} likelihood</p>
          <h3 className="text-lg font-semibold">{cause.title}</h3>
        </div>
        <VerdictBadge verdict={cause.verdict} />
      </div>
      <p className="text-sm">{cause.explanation}</p>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="muted">Difficulty</dt>
          <dd className="font-semibold">{"●".repeat(cause.difficulty)}{"○".repeat(5 - cause.difficulty)}</dd>
        </div>
        <div>
          <dt className="muted">DIY time</dt>
          <dd className="font-semibold">{cause.diy_time_minutes < 60 ? `${cause.diy_time_minutes} min` : `${Math.round(cause.diy_time_minutes / 6) / 10} h`}</dd>
        </div>
        <div>
          <dt className="muted">Parts</dt>
          <dd className="font-semibold">{moneyRange(parts.low, parts.high, currency)}</dd>
        </div>
        <div>
          <dt className="muted">Shop price</dt>
          <dd className="font-semibold">{moneyRange(cause.shop_cost_low, cause.shop_cost_high, currency)}</dd>
        </div>
      </dl>

      <div className="rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
        <p className="font-medium">How to check</p>
        <p>{cause.how_to_confirm}</p>
      </div>

      <p className="text-sm">
        <span className="font-medium">Why this verdict: </span>
        {cause.verdict_reason}
      </p>

      <form action={startRepair} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="diagnosis_id" value={diagnosisId} />
        <input type="hidden" name="cause_index" value={index} />
        {!cause.forced_shop && (
          <button name="path" value="diy" className={cause.verdict === "diy" ? "btn-primary flex-1" : "btn-secondary flex-1"}>
            Fix it myself{saving > 0 ? ` · save ~${money(saving, currency)}` : ""}
          </button>
        )}
        <button name="path" value="shop" className={cause.verdict === "shop" ? "btn-primary flex-1" : "btn-secondary flex-1"}>
          Take it to a shop
        </button>
      </form>
    </article>
  );
}
