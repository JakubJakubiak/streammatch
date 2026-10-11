// Jev (fast decision model) for browser scripts. The OpenRouter key stays on
// the Convex deployment, so questions are sent through its `ai` actions.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function convexRun(name, args) {
  const { stdout } = await run('npx', ['convex', 'run', name, JSON.stringify(args)], {
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

/** Answers `questions` about one piece of text or JSON. */
export async function decide(state, questions) {
  return (await convexRun('ai:decide', { state, questions })).answers;
}

/**
 * Answers the same `questions` about every item, in one round trip.
 * Returns `{ answers: [...one per item, in order], cost }`.
 */
export async function decideMany(states, questions) {
  return await convexRun('ai:decideMany', { states, questions });
}

/** True when a yes/no answer is confident enough to act on without a second look. */
export const isSure = (noul, margin = 0.3) => noul <= margin || noul >= 1 - margin;
