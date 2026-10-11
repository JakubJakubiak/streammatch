import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const intent = v.union(
  v.literal("friends"),
  v.literal("collab"),
  v.literal("dating"),
);

export default defineSchema({
  ...authTables,

  // Auth identity. App data lives in `profiles`.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    twitchId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  profiles: defineTable({
    userId: v.id("users"),
    twitchId: v.optional(v.string()),
    login: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.string(),
    tags: v.array(v.string()),
    intent,
    broadcasterType: v.optional(v.string()),
    followerCount: v.optional(v.number()),

    // Live status, refreshed from Twitch by a cron.
    isLive: v.boolean(),
    streamTitle: v.optional(v.string()),
    gameName: v.optional(v.string()),
    viewerCount: v.optional(v.number()),

    // Coarse location (rounded to ~1 km) and the 1° grid cell it falls in.
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    cell: v.optional(v.string()),
    // null = no distance limit.
    maxDistanceKm: v.union(v.number(), v.null()),

    discoverable: v.boolean(),
    onboarded: v.boolean(),
    lastActiveAt: v.number(),
    isDemo: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_cell", ["cell"])
    .index("by_lastActive", ["lastActiveAt"])
    .index("by_twitchId", ["twitchId"]),

  swipes: defineTable({
    fromId: v.id("users"),
    toId: v.id("users"),
    liked: v.boolean(),
  })
    .index("by_from_to", ["fromId", "toId"])
    .index("by_to", ["toId"]),

  // userA < userB (string order) so a pair has exactly one row.
  matches: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    lastMessageAt: v.optional(v.number()),
    lastMessageText: v.optional(v.string()),
    lastSenderId: v.optional(v.id("users")),
    readAtA: v.number(),
    readAtB: v.number(),
  })
    .index("by_pair", ["userA", "userB"])
    .index("by_userA", ["userA"])
    .index("by_userB", ["userB"]),

  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    body: v.string(),
  }).index("by_match", ["matchId"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_blocker", ["blockerId", "blockedId"])
    .index("by_blocked", ["blockedId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    reportedId: v.id("users"),
    reason: v.string(),
  }).index("by_reported", ["reportedId"]),

  // Premium access, written only by the RevenueCat webhook and refresh action.
  subscriptions: defineTable({
    userId: v.id("users"),
    premiumUntil: v.number(),
    productId: v.optional(v.string()),
    store: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Likes used on `day` (UTC, YYYY-MM-DD). One row per user, reset lazily.
  likeUsage: defineTable({
    userId: v.id("users"),
    day: v.string(),
    likes: v.number(),
  }).index("by_user", ["userId"]),

  twitchAppTokens: defineTable({
    accessToken: v.string(),
    expiresAt: v.number(),
  }),
});
