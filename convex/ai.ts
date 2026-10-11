import { internalAction } from "./_generated/server";

const OPENROUTER = "https://openrouter.ai/api/v1";

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
