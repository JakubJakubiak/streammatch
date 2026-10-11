import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  httpAction,
  internalMutation,
  query,
  type MutationCtx,
} from "./_generated/server";

/** Likes a free account can send per UTC day. Premium is unlimited. */
export const FREE_DAILY_LIKES = 20;
/** Entitlement identifier configured in RevenueCat. */
const ENTITLEMENT = "premium";

const utcDay = (timestamp: number) =>
  new Date(timestamp).toISOString().slice(0, 10);

async function subscriptionOf(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

/**
 * Counts one like against the free daily allowance.
 * Throws `{ code: "LIKE_LIMIT" }` when a free account has none left.
 */
export async function spendLike(ctx: MutationCtx, userId: Id<"users">) {
  const now = Date.now();
  const subscription = await subscriptionOf(ctx, userId);
  if (subscription !== null && subscription.premiumUntil > now) return;

  const today = utcDay(now);
  const usage = await ctx.db
    .query("likeUsage")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  const used = usage !== null && usage.day === today ? usage.likes : 0;
  if (used >= FREE_DAILY_LIKES) throw new ConvexError({ code: "LIKE_LIMIT" });

  if (usage === null) {
    await ctx.db.insert("likeUsage", { userId, day: today, likes: 1 });
  } else {
    await ctx.db.patch(usage._id, { day: today, likes: used + 1 });
  }
}

/**
 * Raw billing state. Queries cannot read the clock, so the client turns this
 * into "premium now" and "likes left today"; mutations enforce it for real.
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const [subscription, usage] = await Promise.all([
      ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique(),
      ctx.db
        .query("likeUsage")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique(),
    ]);
    return {
      userId,
      premiumUntil: subscription?.premiumUntil ?? null,
      dailyLikes: FREE_DAILY_LIKES,
      usageDay: usage?.day ?? null,
      usageLikes: usage?.likes ?? 0,
    };
  },
});

export const setPremium = internalMutation({
  args: {
    userId: v.string(),
    premiumUntil: v.number(),
    productId: v.optional(v.string()),
    store: v.optional(v.string()),
  },
  handler: async (ctx, { userId: rawUserId, ...fields }) => {
    // The id comes from outside (RevenueCat's app_user_id), so validate it.
    const userId = ctx.db.normalizeId("users", rawUserId);
    if (userId === null || (await ctx.db.get(userId)) === null) return false;
    const existing = await subscriptionOf(ctx, userId);
    if (existing === null) {
      await ctx.db.insert("subscriptions", { userId, ...fields });
    } else {
      await ctx.db.patch(existing._id, fields);
    }
    return true;
  },
});

/**
 * Gives a user premium without a purchase, for testing.
 * Run with: npx convex run billing:grantPremium '{"userId": "...", "days": 30}'
 * Pass days: 0 to take it away again.
 */
export const grantPremium = internalMutation({
  args: { userId: v.string(), days: v.number() },
  handler: async (ctx, { userId, days }): Promise<boolean> =>
    await ctx.runMutation(internal.billing.setPremium, {
      userId,
      premiumUntil: Date.now() + days * 24 * 60 * 60 * 1000,
      productId: "manual_grant",
    }),
});

type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  product_id?: string;
  store?: string;
};

/**
 * RevenueCat calls this on every purchase, renewal and expiration.
 * Set the same value as REVENUECAT_WEBHOOK_AUTH in the RevenueCat dashboard's
 * webhook "Authorization header" field.
 */
export const revenueCatWebhook = httpAction(async (ctx, request) => {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected || request.headers.get("Authorization") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { event }: { event?: RevenueCatEvent } = await request.json();
  const grantsPremium = event?.entitlement_ids?.includes(ENTITLEMENT) ?? false;
  if (event?.app_user_id && grantsPremium) {
    // Subscription events carry the current expiry (also on EXPIRATION and
    // CANCELLATION), so storing it covers the whole lifecycle. A lifetime
    // purchase has no expiry; a cancellation of one is a refund.
    const lifetime = event.expiration_at_ms == null;
    const premiumUntil = !lifetime
      ? event.expiration_at_ms!
      : event.type === "CANCELLATION"
        ? 0
        : Number.MAX_SAFE_INTEGER;
    await ctx.runMutation(internal.billing.setPremium, {
      userId: event.app_user_id,
      premiumUntil,
      productId: event.product_id,
      store: event.store,
    });
  }
  return new Response(null, { status: 200 });
});

/**
 * Asks RevenueCat for the caller's entitlement right now, so a purchase
 * unlocks immediately instead of waiting for the webhook.
 */
export const refresh = action({
  args: {},
  handler: async (ctx): Promise<{ premium: boolean }> => {
    const userId = await getAuthUserId(ctx);
    const secret = process.env.REVENUECAT_SECRET_KEY;
    if (userId === null || !secret) return { premium: false };

    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    if (!response.ok) {
      throw new Error(`RevenueCat lookup failed: ${response.status}`);
    }
    const body: {
      subscriber?: {
        entitlements?: Record<
          string,
          { expires_date: string | null; product_identifier?: string }
        >;
      };
    } = await response.json();
    const entitlement = body.subscriber?.entitlements?.[ENTITLEMENT];
    if (entitlement === undefined) return { premium: false };

    // A null expiry means a lifetime purchase.
    const premiumUntil =
      entitlement.expires_date === null
        ? Number.MAX_SAFE_INTEGER
        : Date.parse(entitlement.expires_date);
    await ctx.runMutation(internal.billing.setPremium, {
      userId,
      premiumUntil,
      productId: entitlement.product_identifier,
    });
    return { premium: premiumUntil > Date.now() };
  },
});
