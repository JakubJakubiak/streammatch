#!/usr/bin/env node
// Runs a Playwright script in Google Chrome with a dedicated, persistent profile.
//
//   node .claude/skills/playwright/run.mjs --open <url>          open a page and wait until the window is closed
//   node .claude/skills/playwright/run.mjs <script.mjs> [args…]  run a script, print its result as JSON
//
// A script default-exports `async ({ page, context, args, jev }) => result`.
// `jev.decide` / `jev.decideMany` ask the Jev decision model (see jev.mjs).
// Set PW_HEADLESS=1 to run without a window.
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

import * as jev from './jev.mjs';

const PROFILE = process.env.PW_PROFILE ?? join(homedir(), '.streammatch-playwright');

const [target, ...args] = process.argv.slice(2);
if (!target || (target === '--open' && !args[0])) {
  console.error('Usage: run.mjs --open <url> | run.mjs <script.mjs> [args…]');
  process.exit(2);
}

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: process.env.PW_HEADLESS === '1',
  viewport: null,
});
const page = context.pages()[0] ?? (await context.newPage());

try {
  if (target === '--open') {
    await page.goto(args[0]);
    console.error('Window open. Close it when you are done.');
    await new Promise((done) => context.on('close', done));
  } else {
    const script = await import(pathToFileURL(resolve(target)).href);
    const result = await script.default({ page, context, args, jev });
    if (result !== undefined) console.log(JSON.stringify(result, null, 2));
  }
} finally {
  await context.close().catch(() => {});
}
