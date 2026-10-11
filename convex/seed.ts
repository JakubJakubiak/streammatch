import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { cellOf, coarsen } from "./geo";

const NAMES = [
  "PixelWitch", "NocnaSowa", "KawaiiKoder", "RetroRyba", "LunaPlays",
  "SpeedrunStach", "CozyKasia", "BossFightBartek", "IndieIga", "LofiLena",
  "TryhardTomek", "ChillCzarek", "ArtByAda", "MeowMarta", "GGGrzegorz",
  "VtuberWera", "DungeonDawid", "RhythmRita", "SoulsSzymon", "FarmFela",
];
const GAMES = [
  "Just Chatting", "League of Legends", "Minecraft", "Valorant",
  "Stardew Valley", "Elden Ring", "Art", "Music", "Counter-Strike", "Hades II",
];
const TAGS = [
  "cozy", "fps", "indie", "speedrun", "art", "music", "anime", "retro",
  "horror", "rpg", "irl", "esports", "cats", "coding", "vtuber",
];
const INTENTS = ["friends", "collab", "dating"] as const;

// Small deterministic generator so every seed run produces the same people.
function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates demo streamers scattered around a point (default: Warsaw).
 * Run with: npx convex run seed:run '{"lat": 52.23, "lng": 21.01}'
 */
export const run = internalMutation({
  args: { lat: v.optional(v.number()), lng: v.optional(v.number()) },
  handler: async (ctx, { lat = 52.23, lng = 21.01 }) => {
    const random = mulberry(42);
    const pick = <T,>(items: readonly T[]) =>
      items[Math.floor(random() * items.length)];

    let created = 0;
    for (const name of NAMES) {
      const login = name.toLowerCase();
      // Spread over roughly ±1.5° (~150 km) with most people close in.
      const spread = random() ** 2 * 1.5;
      const angle = random() * 2 * Math.PI;
      const position = {
        lat: coarsen(lat + Math.sin(angle) * spread),
        lng: coarsen(lng + Math.cos(angle) * spread * 1.6),
      };
      const isLive = random() < 0.35;
      const game = pick(GAMES);
      const fields = {
        displayName: name,
        avatarUrl: `https://api.dicebear.com/9.x/thumbs/png?seed=${login}&size=512`,
        bio: `Streamuję ${game}. Szukam ludzi do wspólnego grania i gadania po streamie.`,
        tags: [...new Set([pick(TAGS), pick(TAGS), pick(TAGS)])],
        intent: pick(INTENTS),
        broadcasterType: random() < 0.3 ? "affiliate" : "",
        followerCount: Math.floor(random() ** 3 * 20000) + 12,
        isLive,
        streamTitle: isLive ? `${game} — wbijajcie!` : undefined,
        gameName: isLive ? game : undefined,
        viewerCount: isLive ? Math.floor(random() * 400) + 3 : undefined,
        ...position,
        cell: cellOf(position.lat, position.lng),
      };

      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_twitchId", (q) => q.eq("twitchId", `demo:${login}`))
        .first();
      if (existing !== null) {
        await ctx.db.patch(existing._id, fields);
        continue;
      }
      const userId = await ctx.db.insert("users", { name });
      await ctx.db.insert("profiles", {
        userId,
        twitchId: `demo:${login}`,
        login,
        ...fields,
        maxDistanceKm: null,
        discoverable: true,
        onboarded: true,
        lastActiveAt: Date.now(),
        isDemo: true,
      });
      created++;
    }

    // Every other demo streamer likes all real users, so swiping right on
    // them produces a match. Re-run the seed after signing up to pick this up.
    const everyone = await ctx.db.query("profiles").collect();
    const real = everyone.filter((p) => !p.isDemo);
    const fans = everyone.filter((p) => p.isDemo).filter((_, i) => i % 2 === 0);
    for (const fan of fans) {
      for (const user of real) {
        const existing = await ctx.db
          .query("swipes")
          .withIndex("by_from_to", (q) =>
            q.eq("fromId", fan.userId).eq("toId", user.userId),
          )
          .unique();
        if (existing === null) {
          await ctx.db.insert("swipes", {
            fromId: fan.userId,
            toId: user.userId,
            liked: true,
          });
        }
      }
    }
    return { created, total: NAMES.length };
  },
});

const DEMO_CHAT = [
  { fromDemo: false, body: "Hey! Caught your stream last night, that clutch was wild" },
  { fromDemo: true, body: "Haha thanks! Pure luck, my hands were shaking" },
  { fromDemo: false, body: "Up for a duo queue this weekend?" },
  { fromDemo: true, body: "Yes! Saturday evening works. I'll be live from 19:00" },
];

/**
 * Replaces the messages of every match with a demo streamer by a short
 * scripted conversation, so chats are not one-sided while testing.
 * Run with: npx convex run seed:demoChat
 */
export const demoChat = internalMutation({
  args: {},
  handler: async (ctx) => {
    let chats = 0;
    for (const match of await ctx.db.query("matches").collect()) {
      const profiles = await Promise.all(
        [match.userA, match.userB].map((userId) =>
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique(),
        ),
      );
      const demo = profiles.find((p) => p?.isDemo);
      const real = profiles.find((p) => p && !p.isDemo);
      if (!demo || !real) continue;

      const old = await ctx.db
        .query("messages")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .collect();
      for (const message of old) await ctx.db.delete(message._id);
      for (const line of DEMO_CHAT) {
        await ctx.db.insert("messages", {
          matchId: match._id,
          senderId: line.fromDemo ? demo.userId : real.userId,
          body: line.body,
        });
      }
      const last = DEMO_CHAT[DEMO_CHAT.length - 1];
      await ctx.db.patch(match._id, {
        lastMessageAt: Date.now(),
        lastMessageText: last.body,
        lastSenderId: last.fromDemo ? demo.userId : real.userId,
      });
      chats++;
    }
    return { chats };
  },
});
