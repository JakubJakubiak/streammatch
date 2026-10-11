import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

const HELIX = "https://api.twitch.tv/helix";
const HELIX_BATCH = 100;
const LIVE_REFRESH_LIMIT = 1000;

type HelixUser = {
  login: string;
  display_name: string;
  description: string;
  profile_image_url: string;
  broadcaster_type: string;
};
type HelixStream = {
  user_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
};

export const cachedToken = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("twitchAppTokens").first(),
});

export const saveToken = internalMutation({
  args: { accessToken: v.string(), expiresAt: v.number() },
  handler: async (ctx, token) => {
    for (const old of await ctx.db.query("twitchAppTokens").collect()) {
      await ctx.db.delete(old._id);
    }
    await ctx.db.insert("twitchAppTokens", token);
  },
});

export const twitchIdOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile?.twitchId ?? null;
  },
});

export const applyUser = internalMutation({
  args: {
    userId: v.id("users"),
    login: v.string(),
    displayName: v.string(),
    description: v.string(),
    avatarUrl: v.string(),
    broadcasterType: v.string(),
    followerCount: v.optional(v.number()),
  },
  handler: async (ctx, { userId, description, ...fields }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null) return;
    await ctx.db.patch(profile._id, {
      ...fields,
      // The Twitch bio is only a starting point; never overwrite the user's own.
      ...(profile.bio === "" && { bio: description.slice(0, 300) }),
    });
  },
});

export const linkedTwitchIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_lastActive")
      .order("desc")
      .take(LIVE_REFRESH_LIMIT);
    return profiles
      .filter((p) => p.twitchId !== undefined && !p.isDemo)
      .map((p) => p.twitchId!);
  },
});

export const applyLive = internalMutation({
  args: {
    twitchIds: v.array(v.string()),
    streams: v.array(
      v.object({
        twitchId: v.string(),
        gameName: v.string(),
        title: v.string(),
        viewerCount: v.number(),
      }),
    ),
  },
  handler: async (ctx, { twitchIds, streams }) => {
    const live = new Map(streams.map((s) => [s.twitchId, s]));
    for (const twitchId of twitchIds) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_twitchId", (q) => q.eq("twitchId", twitchId))
        .first();
      if (profile === null) continue;
      const stream = live.get(twitchId);
      if (stream === undefined && !profile.isLive) continue;
      await ctx.db.patch(profile._id, {
        isLive: stream !== undefined,
        streamTitle: stream?.title,
        gameName: stream?.gameName,
        viewerCount: stream?.viewerCount,
      });
    }
  },
});

async function appToken(ctx: ActionCtx) {
  const clientId = process.env.AUTH_TWITCH_ID;
  const clientSecret = process.env.AUTH_TWITCH_SECRET;
  if (!clientId || !clientSecret) return null;

  const cached = await ctx.runQuery(internal.twitch.cachedToken);
  if (cached !== null && cached.expiresAt > Date.now() + 60_000) {
    return { clientId, accessToken: cached.accessToken };
  }
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!response.ok) {
    throw new Error(`Twitch token request failed: ${response.status}`);
  }
  const body: { access_token: string; expires_in: number } =
    await response.json();
  await ctx.runMutation(internal.twitch.saveToken, {
    accessToken: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  });
  return { clientId, accessToken: body.access_token };
}

async function helix<T>(
  auth: { clientId: string; accessToken: string },
  path: string,
): Promise<T> {
  const response = await fetch(`${HELIX}${path}`, {
    headers: {
      "Client-Id": auth.clientId,
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Twitch ${path} failed: ${response.status}`);
  }
  return await response.json();
}

async function liveStreams(
  auth: { clientId: string; accessToken: string },
  twitchIds: string[],
) {
  const params = twitchIds.map((id) => `user_id=${id}`).join("&");
  const { data } = await helix<{ data: HelixStream[] }>(
    auth,
    `/streams?first=${HELIX_BATCH}&${params}`,
  );
  return data.map((stream) => ({
    twitchId: stream.user_id,
    gameName: stream.game_name,
    title: stream.title,
    viewerCount: stream.viewer_count,
  }));
}

/** Pulls a user's public Twitch profile, follower count and live status. */
export const syncUser = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const twitchId = await ctx.runQuery(internal.twitch.twitchIdOf, { userId });
    const auth = await appToken(ctx);
    if (twitchId === null || auth === null) return;

    const users = await helix<{ data: HelixUser[] }>(
      auth,
      `/users?id=${twitchId}`,
    );
    const user = users.data[0];
    if (user === undefined) return;
    const followers = await helix<{ total: number }>(
      auth,
      `/channels/followers?broadcaster_id=${twitchId}&first=1`,
    ).catch(() => null);

    await ctx.runMutation(internal.twitch.applyUser, {
      userId,
      login: user.login,
      displayName: user.display_name,
      description: user.description,
      avatarUrl: user.profile_image_url,
      broadcasterType: user.broadcaster_type,
      followerCount: followers?.total,
    });
    await ctx.runMutation(internal.twitch.applyLive, {
      twitchIds: [twitchId],
      streams: await liveStreams(auth, [twitchId]),
    });
  },
});

/** Cron: refreshes who is live among recently active profiles. */
export const refreshLive = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = await appToken(ctx);
    if (auth === null) return;
    const twitchIds = await ctx.runQuery(internal.twitch.linkedTwitchIds);
    for (let i = 0; i < twitchIds.length; i += HELIX_BATCH) {
      const batch = twitchIds.slice(i, i + HELIX_BATCH);
      await ctx.runMutation(internal.twitch.applyLive, {
        twitchIds: batch,
        streams: await liveStreams(auth, batch),
      });
    }
  },
});
