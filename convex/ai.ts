import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const OPENROUTER = "https://openrouter.ai/api/v1";
// Jev is served by the Decisions API, not the chat completions endpoint.
const DECISIONS = "https://openrouter.ai/api/alpha/decisions";
const JEV = "typesafe/jev-1.13";

/**
 * Checks that OPENROUTER_API_KEY is set and accepted, without revealing it.
 * Run with: npx convex run ai:checkKey
 */
export const checkKey = internalAction({
  args: {},
  handler: async () => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return { ok: false, reason: "OPENROUTER_API_KEY is not set" };

    const response = await fetch(`${OPENROUTER}/key`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) {
      return { ok: false, reason: `OpenRouter rejected the key (${response.status})` };
    }
    const { data }: {
      data: { label?: string; limit: number | null; usage: number; is_free_tier?: boolean };
    } = await response.json();
    return {
      ok: true,
      limit: data.limit,
      usage: data.usage,
      freeTier: data.is_free_tier ?? null,
    };
  },
});

/**
 * Asks Jev (TypeSafe's decision model) a batch of questions about one state.
 * Each question is `noul` (yes/no), `choice` (pick one of `criteria`) or
 * `score` (position on an ordered `criteria` scale).
 *
 * Run with:
 *   npx convex run ai:decide '{"state": "...", "questions": {"spam": {"type": "noul", "instructions": "Is this spam?"}}}'
 */
export const decide = internalAction({
  args: { state: v.any(), questions: v.any() },
  handler: async (_ctx, { state, questions }) => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not set");
    const response = await fetch(DECISIONS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: JEV, state, questions }),
    });
    if (!response.ok) {
      throw new Error(`Jev request failed: ${response.status} ${await response.text()}`);
    }
    return await response.json();
  },
});
