import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { distanceKm } from "./geo";

type Ctx = QueryCtx | MutationCtx;

export async function profileOf(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function currentProfile(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await profileOf(ctx, userId);
}

export async function requireProfile(ctx: Ctx) {
  const profile = await currentProfile(ctx);
  if (profile === null) throw new ConvexError("Not signed in");
  return profile;
}

/** Ids of everyone the user has blocked or been blocked by. */
export async function blockedIds(ctx: Ctx, userId: Id<"users">) {
  const [mine, theirs] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect(),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .collect(),
  ]);
  return new Set<Id<"users">>([
    ...mine.map((b) => b.blockedId),
    ...theirs.map((b) => b.blockerId),
  ]);
}

export function pairOf(a: Id<"users">, b: Id<"users">) {
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

export async function matchBetween(ctx: Ctx, a: Id<"users">, b: Id<"users">) {
  const { userA, userB } = pairOf(a, b);
  return await ctx.db
    .query("matches")
    .withIndex("by_pair", (q) => q.eq("userA", userA).eq("userB", userB))
    .unique();
}

/** Loads a match and checks the caller is one of its two members. */
export async function requireMatch(
  ctx: Ctx,
  matchId: Id<"matches">,
  userId: Id<"users">,
) {
  const match = await ctx.db.get(matchId);
  if (match === null || (match.userA !== userId && match.userB !== userId)) {
    throw new ConvexError("Match not found");
  }
  return match;
}

/** What other users are allowed to see. Never includes coordinates. */
export function publicProfile(profile: Doc<"profiles">, viewer: Doc<"profiles">) {
  const hasBoth =
    profile.lat !== undefined &&
    profile.lng !== undefined &&
    viewer.lat !== undefined &&
    viewer.lng !== undefined;
  const km = hasBoth
    ? distanceKm(
        { lat: viewer.lat!, lng: viewer.lng! },
        { lat: profile.lat!, lng: profile.lng! },
      )
    : null;
  return {
    userId: profile.userId,
    login: profile.login,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio,
    tags: profile.tags,
    sharedTags: profile.tags.filter((tag) => viewer.tags.includes(tag)),
    intent: profile.intent,
    broadcasterType: profile.broadcasterType ?? null,
    followerCount: profile.followerCount ?? null,
    isLive: profile.isLive,
    streamTitle: profile.streamTitle ?? null,
    gameName: profile.gameName ?? null,
    viewerCount: profile.viewerCount ?? null,
    distanceKm: km === null ? null : Math.max(1, Math.round(km)),
  };
}

export type PublicProfile = ReturnType<typeof publicProfile>;
