import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { profileOf, publicProfile, requireMatch, requireProfile } from "./lib";

const otherOf = (match: Doc<"matches">, userId: Id<"users">) =>
  match.userA === userId ? match.userB : match.userA;

const isUnread = (match: Doc<"matches">, userId: Id<"users">) => {
  const readAt = match.userA === userId ? match.readAtA : match.readAtB;
  return (
    match.lastMessageAt !== undefined &&
    match.lastSenderId !== userId &&
    match.lastMessageAt > readAt
  );
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireProfile(ctx);
    const matches = [
      ...(await ctx.db
        .query("matches")
        .withIndex("by_userA", (q) => q.eq("userA", me.userId))
        .collect()),
      ...(await ctx.db
        .query("matches")
        .withIndex("by_userB", (q) => q.eq("userB", me.userId))
        .collect()),
    ];
    const rows = await Promise.all(
      matches.map(async (match) => {
        const other = await profileOf(ctx, otherOf(match, me.userId));
        if (other === null) return null;
        return {
          matchId: match._id,
          other: publicProfile(other, me),
          lastMessageText: match.lastMessageText ?? null,
          lastActivityAt: match.lastMessageAt ?? match._creationTime,
          unread: isUnread(match, me.userId),
        };
      }),
    );
    return rows
      .filter((row) => row !== null)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireProfile(ctx);
    const matches = [
      ...(await ctx.db
        .query("matches")
        .withIndex("by_userA", (q) => q.eq("userA", me.userId))
        .collect()),
      ...(await ctx.db
        .query("matches")
        .withIndex("by_userB", (q) => q.eq("userB", me.userId))
        .collect()),
    ];
    return matches.filter((match) => isUnread(match, me.userId)).length;
  },
});

export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const me = await requireProfile(ctx);
    const match = await ctx.db.get(matchId);
    if (match === null || (match.userA !== me.userId && match.userB !== me.userId)) {
      return null;
    }
    const other = await profileOf(ctx, otherOf(match, me.userId));
    if (other === null) return null;
    return { matchId, other: publicProfile(other, me) };
  },
});

export const unmatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const me = await requireProfile(ctx);
    const match = await requireMatch(ctx, matchId, me.userId);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .collect();
    for (const message of messages) await ctx.db.delete(message._id);
    await ctx.db.delete(matchId);

    // Turn the like into a pass so the pair does not immediately re-match.
    const mine = await ctx.db
      .query("swipes")
      .withIndex("by_from_to", (q) =>
        q.eq("fromId", me.userId).eq("toId", otherOf(match, me.userId)),
      )
      .unique();
    if (mine !== null) await ctx.db.patch(mine._id, { liked: false });
  },
});
