import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  blockedIds,
  matchBetween,
  pairOf,
  profileOf,
  requireProfile,
} from "./lib";

/** Records a like or pass. A like that is returned creates a match. */
export const swipe = mutation({
  args: { toId: v.id("users"), liked: v.boolean() },
  handler: async (ctx, { toId, liked }) => {
    const me = await requireProfile(ctx);
    if (toId === me.userId) throw new ConvexError("Cannot swipe on yourself");
    const target = await profileOf(ctx, toId);
    if (target === null || (await blockedIds(ctx, me.userId)).has(toId)) {
      throw new ConvexError("Profile not available");
    }

    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_from_to", (q) =>
        q.eq("fromId", me.userId).eq("toId", toId),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("swipes", { fromId: me.userId, toId, liked });
    } else {
      await ctx.db.patch(existing._id, { liked });
    }
    if (!liked) return { matchId: null };

    const theirs = await ctx.db
      .query("swipes")
      .withIndex("by_from_to", (q) =>
        q.eq("fromId", toId).eq("toId", me.userId),
      )
      .unique();
    if (theirs === null || !theirs.liked) return { matchId: null };

    const match = await matchBetween(ctx, me.userId, toId);
    if (match !== null) return { matchId: match._id };
    const now = Date.now();
    const matchId = await ctx.db.insert("matches", {
      ...pairOf(me.userId, toId),
      readAtA: now,
      readAtB: now,
    });
    return { matchId };
  },
});
