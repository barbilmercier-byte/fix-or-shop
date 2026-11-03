// Mirrors supabase/functions/_shared/schemas.ts (the shape the diagnose function stores).

export type Verdict = "diy" | "shop";

export type Cause = {
  title: string;
  explanation: string;
  likelihood: "high" | "medium" | "low";
  system: string;
  how_to_confirm: string;
  difficulty: number;
  diy_time_minutes: number;
  tools: string[];
  parts: { name: string; cost_low: number; cost_high: number }[];
  shop_cost_low: number;
  shop_cost_high: number;
  verdict: Verdict;
  verdict_reason: string;
  forced_shop: boolean;
};

export type DiagnosisResult = {
  summary: string;
  safe_to_drive: "yes" | "with_caution" | "no";
  safety_note: string;
  currency: string;
  causes: Cause[];
  questions_to_narrow_down: string[];
};

export type Recall = { campaign: string; component: string; summary: string; remedy: string; date: string };

export type Guide = {
  overview: string;
  safety_warnings: string[];
  tools: string[];
  parts: string[];
  steps: { title: string; detail: string; caution: string | null }[];
  done_when: string;
  stop_if: string[];
  specs_to_look_up: string[];
};

export type Vehicle = {
  id: string;
  vin: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  nickname: string | null;
  mileage: number | null;
};

export function vehicleName(v: Pick<Vehicle, "year" | "make" | "model" | "nickname">) {
  return v.nickname || `${v.year} ${v.make} ${v.model}`;
}
