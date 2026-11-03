import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { HttpError } from "./http.ts";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

/** Model is configurable so cost can be tuned without a code change. */
export const MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-opus-5-5";

/** Models that accept the server-side `fallbacks: "default"` mode. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);

type Content = Anthropic.Beta.Messages.BetaContentBlockParam[];

/** One structured-output call. Returns the parsed object or throws an HttpError. */
export async function askJson<S extends z.ZodType>(opts: {
  system: string;
  content: Content;
  schema: S;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  const useFallbacks = FALLBACK_MODELS.has(MODEL);
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(opts.schema) },
      system: opts.system,
      messages: [{ role: "user", content: opts.content }],
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });

    if (response.stop_reason === "refusal") {
      throw new HttpError(422, "The assistant could not help with this request.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new HttpError(502, "The assistant's answer was incomplete. Please try again.");
    }
    return response.parsed_output as z.infer<S>;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "Busy right now, try again in a minute.");
    if (err instanceof Anthropic.APIError) {
      console.error("Claude API error", err.status, err.message);
      throw new HttpError(502, "The diagnosis service is unavailable. Please try again.");
    }
    throw err;
  }
}
