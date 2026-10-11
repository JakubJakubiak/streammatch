import Twitch from "@auth/core/providers/twitch";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

// Deep links the native app may be sent back to after OAuth.
const APP_REDIRECT_PREFIXES = ["streammatch://", "exp://"];

export const twitchConfigured = () =>
  Boolean(process.env.AUTH_TWITCH_ID && process.env.AUTH_TWITCH_SECRET);

// Passwordless demo accounts, for trying the app before Twitch is set up.
// Never enable on a production deployment.
export const demoLoginEnabled = () => process.env.DEMO_LOGIN === "true";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Twitch({
      // Only the public identity is needed, so the email scope is dropped.
      authorization: { params: { scope: "openid" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          image: profile.picture,
          twitchId: profile.sub,
        };
      },
    }),
    ...(demoLoginEnabled() ? [Anonymous] : []),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
      if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
        return `${siteUrl}${redirectTo}`;
      }
      if (
        APP_REDIRECT_PREFIXES.some((prefix) => redirectTo.startsWith(prefix)) ||
        (siteUrl !== "" && redirectTo.startsWith(siteUrl))
      ) {
        return redirectTo;
      }
      throw new Error(`Invalid redirectTo ${redirectTo}`);
    },

    async afterUserCreatedOrUpdated(ctx, { userId, profile, provider }) {
      const db = (ctx as unknown as MutationCtx).db;
      const twitchId =
        typeof profile.twitchId === "string" ? profile.twitchId : undefined;
      const name = typeof profile.name === "string" ? profile.name : undefined;
      const image =
        typeof profile.image === "string" ? profile.image : undefined;

      const existing = await db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (existing === null) {
        const login = name ?? `demo_${userId.slice(-5)}`;
        await db.insert("profiles", {
          userId,
          twitchId,
          login: login.toLowerCase(),
          displayName: login,
          avatarUrl: image,
          bio: "",
          tags: [],
          intent: "friends",
          isLive: false,
          maxDistanceKm: 100,
          discoverable: true,
          onboarded: false,
          lastActiveAt: Date.now(),
        });
      } else {
        await db.patch(existing._id, { lastActiveAt: Date.now() });
      }

      if (provider.id === "twitch") {
        await ctx.scheduler.runAfter(0, internal.twitch.syncUser, { userId });
      }
    },
  },
});
