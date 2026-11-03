import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { money } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { vehicleName, type Vehicle } from "@/lib/types";

type Row = {
  id: string;
  title: string;
  path: "diy" | "shop";
  status: string;
  amount_spent: number | null;
  shop_estimate_low: number | null;
  created_at: string;
  completed_at: string | null;
  vehicles: Vehicle;
};

/** Conservative saving: low end of the shop estimate minus what the owner actually spent. */
function saved(r: Row) {
  if (r.path !== "diy" || r.status !== "fixed" || r.shop_estimate_low == null) return 0;
  return Math.max(0, Number(r.shop_estimate_low) - Number(r.amount_spent ?? 0));
}

export default async function LogPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("repairs")
    .select("id, title, path, status, amount_spent, shop_estimate_low, created_at, completed_at, vehicles(year, make, model, nickname)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  const totalSpent = rows.reduce((s, r) => s + Number(r.amount_spent ?? 0), 0);
  const totalSaved = rows.reduce((s, r) => s + saved(r), 0);
  const diyFixed = rows.filter((r) => r.path === "diy" && r.status === "fixed").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Repair log</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Saved by DIY" value={money(totalSaved)} accent />
        <Stat label="Total spent" value={money(totalSpent)} />
        <Stat label="DIY fixes" value={String(diyFixed)} />
      </div>
      <p className="text-xs muted">Savings use the low end of the typical shop price, minus what you spent.</p>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/repairs/${r.id}`} className="card flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm muted">
                    {vehicleName(r.vehicles)} · {new Date(r.completed_at ?? r.created_at).toLocaleDateString()} ·{" "}
                    {r.path === "diy" ? "DIY" : "Shop"}
                    {r.amount_spent != null && ` · ${money(r.amount_spent)}`}
                    {saved(r) > 0 && ` · saved ${money(saved(r))}`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          No repairs yet. <Link href="/garage" className="font-semibold text-orange-600">Diagnose a problem</Link> to start.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? "border-orange-300 dark:border-orange-800" : ""}`}>
      <p className="text-xs muted">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-orange-600" : ""}`}>{value}</p>
    </div>
  );
}
