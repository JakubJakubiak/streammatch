/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app from "../app.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as crons from "../crons.js";
import type * as discover from "../discover.js";
import type * as geo from "../geo.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as profiles from "../profiles.js";
import type * as safety from "../safety.js";
import type * as seed from "../seed.js";
import type * as swipes from "../swipes.js";
import type * as twitch from "../twitch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  app: typeof app;
  auth: typeof auth;
  billing: typeof billing;
  crons: typeof crons;
  discover: typeof discover;
  geo: typeof geo;
  http: typeof http;
  lib: typeof lib;
  matches: typeof matches;
  messages: typeof messages;
  profiles: typeof profiles;
  safety: typeof safety;
  seed: typeof seed;
  swipes: typeof swipes;
  twitch: typeof twitch;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
