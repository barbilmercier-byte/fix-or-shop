import type { Cause, Diagnosis } from "./schemas.ts";

/**
 * Systems where a mistake can injure or kill someone. These always get a Shop verdict,
 * whatever the model said. Enforced in code, not left to the prompt.
 */
export const SHOP_ONLY_SYSTEMS = new Set<Cause["system"]>([
  "brakes",
  "steering",
  "suspension",
  "airbags_srs",
  "seatbelts",
  "fuel_system",
  "hybrid_ev_high_voltage",
]);

export type SafeCause = Cause & { forced_shop: boolean };
export type SafeDiagnosis = Omit<Diagnosis, "causes"> & { causes: SafeCause[] };

export function applySafetyRules(d: Diagnosis): SafeDiagnosis {
  const causes = d.causes.slice(0, 3).map((c) => {
    const forced = SHOP_ONLY_SYSTEMS.has(c.system) || c.difficulty >= 5;
    if (!forced) return { ...c, forced_shop: false };
    return {
      ...c,
      verdict: "shop" as const,
      forced_shop: true,
      verdict_reason:
        "This involves a safety-critical system, so Fix or Shop always recommends a qualified mechanic. " +
        c.verdict_reason,
    };
  });
  return { ...d, causes };
}

export function isShopOnly(cause: { system: string; difficulty: number }): boolean {
  return SHOP_ONLY_SYSTEMS.has(cause.system as Cause["system"]) || cause.difficulty >= 5;
}
