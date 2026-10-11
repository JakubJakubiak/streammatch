import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireMatch, requireProfile } from "./lib";
import { moderationEnabled } from "./moderation";

const MAX_BODY = 1000;
const PAGE = 100;
export const PREVIEW = 80;

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
    return messages
      // Held and refused messages exist only for the person who wrote them.
      .filter((m) => m.status === undefined || m.senderId === me.userId)
      .map((message) => ({
        id: message._id,
        body: message.body,
        sentAt: message._creationTime,
        mine: message.senderId === me.userId,
        blocked: message.status === "blocked",
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

    const now = Date.now();
    const readNow = match.userA === me.userId ? { readAtA: now } : { readAtB: now };

    // With moderation on, the message is held until it has been checked;
    // the match preview and unread state are updated when it is delivered.
    if (moderationEnabled()) {
      const messageId = await ctx.db.insert("messages", {
        matchId,
        senderId: me.userId,
        body: text,
        status: "pending",
      });
      await ctx.db.patch(matchId, readNow);
      await ctx.scheduler.runAfter(0, internal.moderation.checkMessage, { messageId });
      return;
    }

    await ctx.db.insert("messages", { matchId, senderId: me.userId, body: text });
    await ctx.db.patch(matchId, {
      lastMessageAt: now,
      lastMessageText: text.slice(0, PREVIEW),
      lastSenderId: me.userId,
      ...readNow,
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
