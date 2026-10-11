import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMatch, requireProfile } from "./lib";

const MAX_BODY = 1000;
const PAGE = 100;
const PREVIEW = 80;

/** Newest first, which is the order an inverted chat list wants. */
export const list = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const me = await requireProfile(ctx);
    await requireMatch(ctx, matchId, me.userId);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .order("desc")
      .take(PAGE);
    return messages.map((message) => ({
      id: message._id,
      body: message.body,
      sentAt: message._creationTime,
      mine: message.senderId === me.userId,
    }));
  },
});

export const send = mutation({
  args: { matchId: v.id("matches"), body: v.string() },
  handler: async (ctx, { matchId, body }) => {
    const me = await requireProfile(ctx);
    const match = await requireMatch(ctx, matchId, me.userId);
    const text = body.trim();
    if (text.length === 0) throw new ConvexError("Message is empty");
    if (text.length > MAX_BODY) throw new ConvexError("Message is too long");

    await ctx.db.insert("messages", { matchId, senderId: me.userId, body: text });
    const now = Date.now();
    await ctx.db.patch(matchId, {
      lastMessageAt: now,
      lastMessageText: text.slice(0, PREVIEW),
      lastSenderId: me.userId,
      ...(match.userA === me.userId ? { readAtA: now } : { readAtB: now }),
    });
  },
});

export const markRead = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const me = await requireProfile(ctx);
    const match = await requireMatch(ctx, matchId, me.userId);
    const now = Date.now();
    await ctx.db.patch(
      matchId,
      match.userA === me.userId ? { readAtA: now } : { readAtB: now },
    );
  },
});
