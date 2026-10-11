import { query } from "./_generated/server";
import { demoLoginEnabled, twitchConfigured } from "./auth";

/** Which sign-in methods this deployment offers. */
export const config = query({
  args: {},
  handler: async () => ({
    twitchLogin: twitchConfigured(),
    demoLogin: demoLoginEnabled(),
  }),
});
