import type { Verdict } from "@/lib/types";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return verdict === "diy" ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-100">
      Fix it yourself
    </span>
  ) : (
    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-900 dark:text-orange-100">
      Take it to a shop
    </span>
  );
}

const STATUS: Record<string, [string, string]> = {
  in_progress: ["In progress", "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"],
  fixed: ["Fixed", "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"],
  not_fixed: ["Not fixed", "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, cls] = STATUS[status] ?? [status, ""];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
