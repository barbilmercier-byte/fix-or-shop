import { z } from "zod";

/** Car systems the model must classify each cause into. Safety rules key off this list. */
export const SYSTEMS = [
  "brakes",
  "steering",
  "suspension",
  "airbags_srs",
  "seatbelts",
  "fuel_system",
  "hybrid_ev_high_voltage",
  "tires_wheels",
  "engine",
  "cooling",
  "ignition",
  "battery_12v",
  "charging_starting",
  "electrical_12v",
  "lights",
  "transmission_drivetrain",
  "exhaust_emissions",
  "hvac",
  "sensors_warning_lights",
  "fluids_maintenance",
  "wipers_glass",
  "body_interior",
  "other",
] as const;

export const CauseSchema = z.object({
  title: z.string().describe("Short name of the likely cause, e.g. 'Worn front brake pads'"),
  explanation: z.string().describe("Why this matches the symptoms, 1-3 plain-English sentences"),
  likelihood: z.enum(["high", "medium", "low"]),
  system: z.enum(SYSTEMS),
  how_to_confirm: z.string().describe("A simple check the owner can do to confirm or rule this out"),
  difficulty: z.number().int().min(1).max(5).describe("DIY difficulty: 1 = anyone, 5 = professional only"),
  diy_time_minutes: z.number().int().min(0),
  tools: z.array(z.string()),
  parts: z.array(
    z.object({
      name: z.string(),
      cost_low: z.number().min(0),
      cost_high: z.number().min(0),
    }),
  ),
  shop_cost_low: z.number().min(0).describe("Typical independent-shop price including labor"),
  shop_cost_high: z.number().min(0),
  verdict: z.enum(["diy", "shop"]),
  verdict_reason: z.string(),
});

export const DiagnosisSchema = z.object({
  summary: z.string().describe("One or two sentences summarising what is most likely going on"),
  safe_to_drive: z.enum(["yes", "with_caution", "no"]),
  safety_note: z.string(),
  currency: z.string().describe("ISO currency code for all costs, e.g. USD"),
  causes: z.array(CauseSchema).describe("The most likely causes, most likely first, at most 3"),
  questions_to_narrow_down: z.array(z.string()).describe("Up to 3 questions that would sharpen the diagnosis"),
});

export const GuideSchema = z.object({
  overview: z.string(),
  safety_warnings: z.array(z.string()),
  tools: z.array(z.string()),
  parts: z.array(z.string()),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      caution: z.string().nullable(),
    }),
  ),
  done_when: z.string().describe("How the owner can tell the fix worked"),
  stop_if: z.array(z.string()).describe("Situations where the owner should stop and take it to a shop"),
  specs_to_look_up: z.array(z.string()).describe(
    "Torque values, fluid types and capacities, part numbers the owner must confirm in the manual",
  ),
});

export const StuckSchema = z.object({
  answer: z.string(),
  should_stop: z.boolean().describe("True if the owner should stop and take the car to a shop"),
});

export type Cause = z.infer<typeof CauseSchema>;
export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type Guide = z.infer<typeof GuideSchema>;
