import { applySafetyRules } from "./safety.ts";
import type { Cause, Diagnosis } from "./schemas.ts";

function cause(over: Partial<Cause>): Cause {
  return {
    title: "x", explanation: "x", likelihood: "high", system: "lights", how_to_confirm: "x",
    difficulty: 1, diy_time_minutes: 10, tools: [], parts: [], shop_cost_low: 50, shop_cost_high: 90,
    verdict: "diy", verdict_reason: "Easy.", ...over,
  };
}
const base: Omit<Diagnosis, "causes"> = {
  summary: "", safe_to_drive: "yes", safety_note: "", currency: "USD", questions_to_narrow_down: [],
};

Deno.test("brake causes are always forced to shop", () => {
  const r = applySafetyRules({ ...base, causes: [cause({ system: "brakes", difficulty: 2 })] });
  if (r.causes[0].verdict !== "shop" || !r.causes[0].forced_shop) throw new Error("brakes not forced");
});

Deno.test("simple bulb replacement stays DIY", () => {
  const r = applySafetyRules({ ...base, causes: [cause({ system: "lights" })] });
  if (r.causes[0].verdict !== "diy" || r.causes[0].forced_shop) throw new Error("bulb changed");
});

Deno.test("difficulty 5 is forced to shop and list is capped at 3", () => {
  const r = applySafetyRules({
    ...base,
    causes: [cause({ difficulty: 5 }), cause({}), cause({}), cause({})],
  });
  if (r.causes.length !== 3 || r.causes[0].verdict !== "shop") throw new Error("cap/difficulty rule failed");
});
