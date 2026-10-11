import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("refresh live status", { minutes: 5 }, internal.twitch.refreshLive);

export default crons;
