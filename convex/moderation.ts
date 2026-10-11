import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { PREVIEW } from "./messages";

const DECISIONS = "https://openrouter.ai/api/alpha/decisions";
const JEV = "typesafe/jev-1.13";
/** A rule counts as broken when Jev is at least this sure. */
const BLOCK_AT = 0.85;

/** Moderation runs only when the deployment has an OpenRouter key. */
export const moderationEnabled = () => Boolean(process.env.OPENROUTER_API_KEY);

const RULES = {
  abuse:
    "Does this text harass, insult, threaten or express hate toward another person?",
  scam: "Is this text spam, advertising, a request for money or gifts, or an attempt to send the reader to a suspicious link?",
  minor:
    "Does this text indicate that its author is under 18, or sexualize someone under 18?",
} as const;

type Rule = keyof typeof RULES;

/**
 * Returns the rules a text breaks, most certain first.
 * Fails open: if Jev cannot be reached, nothing is blocked.
 */
async function brokenRules(text: string): Promise<{ rule: Rule; sure: number }[]> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return [];
  try {
    const response = await fetch(DECISIONS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: JEV,
        state: text,
        questions: Object.fromEntries(
          Object.entries(RULES).map(([rule, instructions]) => [
            rule,
            { type: "noul", instructions },
          ]),
        ),
      }),
    });
    if (!response.ok) {
      console.error(`Moderation request failed: ${response.status}`);
      return [];
    }
    const { answers }: { answers: Record<Rule, { noul: number }> } =
      await response.json();
    return (Object.keys(RULES) as Rule[])
      .map((rule) => ({ rule, sure: answers[rule]?.noul ?? 0 }))
      .filter(({ sure }) => sure >= BLOCK_AT)
      .sort((a, b) => b.sure - a.sure);
  } catch (error) {
    console.error("Moderation request failed", error);
    return [];
  }
}

const describe = (broken: { rule: Rule; sure: number }[]) =>
  broken.map(({ rule, sure }) => `${rule} ${sure.toFixed(2)}`).join(", ");

export const messageBody = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => (await ctx.db.get(messageId))?.body ?? null,
});

/** Delivers a held message, or refuses it and files an automatic report. */
export const resolveMessage = internalMutation({
  args: { messageId: v.id("messages"), reason: v.union(v.string(), v.null()) },
  handler: async (ctx, { messageId, reason }) => {
    const message = await ctx.db.get(messageId);
    if (message === null || message.status !== "pending") return;

    if (reason !== null) {
      await ctx.db.patch(messageId, { status: "blocked" });
      await ctx.db.insert("reports", {
        reportedId: message.senderId,
        reason: `auto (message): ${reason}`,
      });
      return;
    }
    await ctx.db.patch(messageId, { status: undefined });
    // The match may be gone if the pair unmatched or blocked meanwhile.
    if ((await ctx.db.get(message.matchId)) === null) return;
    await ctx.db.patch(message.matchId, {
      lastMessageAt: Date.now(),
      lastMessageText: message.body.slice(0, PREVIEW),
      lastSenderId: message.senderId,
    });
  },
});

export const checkMessage = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const body = await ctx.runQuery(internal.moderation.messageBody, { messageId });
    if (body === null) return;
    const broken = await brokenRules(body);
    await ctx.runMutation(internal.moderation.resolveMessage, {
      messageId,
      reason: broken.length > 0 ? describe(broken) : null,
    });
  },
});

export const bioOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile?.bio ?? null;
  },
});

/** Clears a bio that broke the rules, unless it was edited in the meantime. */
export const removeBio = internalMutation({
  args: { userId: v.id("users"), bio: v.string(), reason: v.string() },
  handler: async (ctx, { userId, bio, reason }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null || profile.bio !== bio) return;
    await ctx.db.patch(profile._id, { bio: "", bioRemoved: true });
    await ctx.db.insert("reports", {
      reportedId: userId,
      reason: `auto (bio): ${reason}`,
    });
  },
});

export const checkBio = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const bio = await ctx.runQuery(internal.moderation.bioOf, { userId });
    if (!bio) return;
    const broken = await brokenRules(bio);
    if (broken.length === 0) return;
    await ctx.runMutation(internal.moderation.removeBio, {
      userId,
      bio,
      reason: describe(broken),
    });
  },
});
