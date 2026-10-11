import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { cellsWithin, distanceKm } from "./geo";
import { blockedIds, publicProfile, requireProfile } from "./lib";

const DECK_SIZE = 20;
const NEARBY_SIZE = 60;
const PER_CELL = 200;
const GLOBAL_POOL = 300;
const MAX_RADIUS_KM = 500;

async function profilesWithin(
  ctx: QueryCtx,
  me: Doc<"profiles">,
  radiusKm: number,
) {
  if (me.lat === undefined || me.lng === undefined) return [];
  const origin = { lat: me.lat, lng: me.lng };
  const radius = Math.min(radiusKm, MAX_RADIUS_KM);
  const perCell = await Promise.all(
    cellsWithin(origin.lat, origin.lng, radius).map((cell) =>
      ctx.db
        .query("profiles")
        .withIndex("by_cell", (q) => q.eq("cell", cell))
        .take(PER_CELL),
    ),
  );
  return perCell
    .flat()
    .filter(
      (p) =>
        p.lat !== undefined &&
        p.lng !== undefined &&
        distanceKm(origin, { lat: p.lat, lng: p.lng }) <= radius,
    );
}

async function visibleTo(
  ctx: QueryCtx,
  me: Doc<"profiles">,
  candidates: Doc<"profiles">[],
) {
  const blocked = await blockedIds(ctx, me.userId);
  return candidates.filter(
    (p) =>
      p.userId !== me.userId &&
      p.discoverable &&
      p.onboarded &&
      !blocked.has(p.userId),
  );
}

/** Profiles to swipe on: live streamers first, then shared interests, then distance. */
export const deck = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireProfile(ctx);
    const pool =
      me.maxDistanceKm !== null && me.cell !== undefined
        ? await profilesWithin(ctx, me, me.maxDistanceKm)
        : await ctx.db
            .query("profiles")
            .withIndex("by_lastActive")
            .order("desc")
            .take(GLOBAL_POOL);

    const visible = await visibleTo(ctx, me, pool);
    const swiped = await Promise.all(
      visible.map((p) =>
        ctx.db
          .query("swipes")
          .withIndex("by_from_to", (q) =>
            q.eq("fromId", me.userId).eq("toId", p.userId),
          )
          .unique(),
      ),
    );

    return visible
      .filter((_, i) => swiped[i] === null)
      .map((p) => publicProfile(p, me))
      .sort(
        (a, b) =>
          Number(b.isLive) - Number(a.isLive) ||
          b.sharedTags.length - a.sharedTags.length ||
          (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      )
      .slice(0, DECK_SIZE);
  },
});

/** Streamers around the caller, closest first. Null when no location is set. */
export const nearby = query({
  args: { radiusKm: v.number(), liveOnly: v.boolean() },
  handler: async (ctx, { radiusKm, liveOnly }) => {
    const me = await requireProfile(ctx);
    if (me.cell === undefined) return null;
    const visible = await visibleTo(
      ctx,
      me,
      await profilesWithin(ctx, me, radiusKm),
    );
    return visible
      .filter((p) => !liveOnly || p.isLive)
      .map((p) => publicProfile(p, me))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, NEARBY_SIZE);
  },
});
