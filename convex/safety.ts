import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { matchBetween, requireProfile } from "./lib";

/** Hides two users from each other and removes any match between them. */
export const block = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireProfile(ctx);
    if (userId === me.userId) throw new ConvexError("Cannot block yourself");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) =>
        q.eq("blockerId", me.userId).eq("blockedId", userId),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("blocks", { blockerId: me.userId, blockedId: userId });
    }
    const match = await matchBetween(ctx, me.userId, userId);
    if (match !== null) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .collect();
      for (const message of messages) await ctx.db.delete(message._id);
      await ctx.db.delete(match._id);
    }
  },
});

export const report = mutation({
  args: { userId: v.id("users"), reason: v.string() },
  handler: async (ctx, { userId, reason }) => {
    const me = await requireProfile(ctx);
    if (userId === me.userId) throw new ConvexError("Cannot report yourself");
    await ctx.db.insert("reports", {
      reporterId: me.userId,
      reportedId: userId,
      reason: reason.trim().slice(0, 500),
    });
  },
});
