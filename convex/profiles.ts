import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { cellOf, coarsen } from "./geo";
import {
  blockedIds,
  currentProfile,
  profileOf,
  publicProfile,
  requireProfile,
} from "./lib";
import { moderationEnabled } from "./moderation";
import { intent } from "./schema";

const MAX_BIO = 300;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;

function cleanTags(tags: string[]) {
  const cleaned = tags
    .map((tag) => tag.trim().toLowerCase().slice(0, MAX_TAG_LENGTH))
    .filter((tag) => tag.length > 0);
  return [...new Set(cleaned)].slice(0, MAX_TAGS);
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const profile = await currentProfile(ctx);
    if (profile === null) return null;
    return {
      userId: profile.userId,
      login: profile.login,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      bio: profile.bio,
      bioRemoved: profile.bioRemoved ?? false,
      tags: profile.tags,
      intent: profile.intent,
      followerCount: profile.followerCount ?? null,
      isLive: profile.isLive,
      hasLocation: profile.cell !== undefined,
      maxDistanceKm: profile.maxDistanceKm,
      discoverable: profile.discoverable,
      onboarded: profile.onboarded,
      linkedToTwitch: profile.twitchId !== undefined,
    };
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const viewer = await requireProfile(ctx);
    const profile = await profileOf(ctx, userId);
    if (profile === null) return null;
    if ((await blockedIds(ctx, viewer.userId)).has(userId)) return null;
    return publicProfile(profile, viewer);
  },
});

export const update = mutation({
  args: {
    bio: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    intent: v.optional(intent),
    maxDistanceKm: v.optional(v.union(v.number(), v.null())),
    discoverable: v.optional(v.boolean()),
    // Sent once, from onboarding, together with the 18+ confirmation.
    confirmAdult: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (args.maxDistanceKm != null && args.maxDistanceKm <= 0) {
      throw new ConvexError("Distance must be positive");
    }
    await ctx.db.patch(profile._id, {
      ...(args.bio !== undefined && {
        bio: args.bio.trim().slice(0, MAX_BIO),
        bioRemoved: undefined,
      }),
      ...(args.tags !== undefined && { tags: cleanTags(args.tags) }),
      ...(args.intent !== undefined && { intent: args.intent }),
      ...(args.maxDistanceKm !== undefined && {
        maxDistanceKm: args.maxDistanceKm,
      }),
      ...(args.discoverable !== undefined && {
        discoverable: args.discoverable,
      }),
      ...(args.confirmAdult === true && { onboarded: true }),
      lastActiveAt: Date.now(),
    });
    if (args.bio !== undefined && args.bio.trim() !== "" && moderationEnabled()) {
      await ctx.scheduler.runAfter(0, internal.moderation.checkBio, {
        userId: profile.userId,
      });
    }
  },
});

export const setLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, { lat, lng }) => {
    const profile = await requireProfile(ctx);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new ConvexError("Invalid coordinates");
    }
    const coarse = { lat: coarsen(lat), lng: coarsen(lng) };
    await ctx.db.patch(profile._id, {
      ...coarse,
      cell: cellOf(coarse.lat, coarse.lng),
      lastActiveAt: Date.now(),
    });
  },
});

export const clearLocation = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    await ctx.db.patch(profile._id, {
      lat: undefined,
      lng: undefined,
      cell: undefined,
    });
  },
});

async function deleteMatchesOf(ctx: MutationCtx, userId: Id<"users">) {
  const matches = [
    ...(await ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", userId))
      .collect()),
    ...(await ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", userId))
      .collect()),
  ];
  for (const match of matches) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", match._id))
      .collect();
    for (const message of messages) await ctx.db.delete(message._id);
    await ctx.db.delete(match._id);
  }
}

/** Permanently removes the caller's account and everything attached to it. */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    const userId = profile.userId;

    await deleteMatchesOf(ctx, userId);

    const swipes = [
      ...(await ctx.db
        .query("swipes")
        .withIndex("by_from_to", (q) => q.eq("fromId", userId))
        .collect()),
      ...(await ctx.db
        .query("swipes")
        .withIndex("by_to", (q) => q.eq("toId", userId))
        .collect()),
    ];
    for (const swipe of swipes) await ctx.db.delete(swipe._id);

    const blocks = [
      ...(await ctx.db
        .query("blocks")
        .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
        .collect()),
      ...(await ctx.db
        .query("blocks")
        .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
        .collect()),
    ];
    for (const block of blocks) await ctx.db.delete(block._id);

    for (const table of ["subscriptions", "likeUsage"] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) await ctx.db.delete(account._id);

    await ctx.db.delete(profile._id);
    await ctx.db.delete(userId);
  },
});
