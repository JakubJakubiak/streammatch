---
name: playwright
description: Drive Google Chrome with a written Playwright script instead of clicking step by step. Use for browser work that is repetitive or has many steps and a known shape — filling long forms from data, uploading files, repeating the same flow for several items, scraping a list into JSON, or smoke-testing the web app and the marketing site. Not for one-off exploration of an unfamiliar page (use the interactive browser tools for that), and not the same thing as the Playwright MCP server.
---

# Playwright scripts in Chrome

A script runs start to finish in one command and returns JSON, so a 30-step flow
costs one tool call instead of thirty screenshots. Explore a page interactively
first if you do not know its structure; then write the script.

## Running

From the project root:

```bash
# Run a script and print what it returns
node .claude/skills/playwright/run.mjs path/to/script.mjs [args…]

# Open a page in the automation profile and wait until the window is closed
node .claude/skills/playwright/run.mjs --open https://example.com
```

`PW_HEADLESS=1` runs without a window (fine for localhost checks; keep the
window visible for anything on a real account so the user can watch).

## Writing a script

```js
export default async ({ page, context, args }) => {
  await page.goto(args[0]);
  await page.getByRole('button', { name: 'Save' }).click();
  return { saved: await page.getByText('Saved').isVisible() };
};
```

- Prefer `getByRole`, `getByLabel` and `getByText` over CSS selectors.
- Return data instead of taking screenshots; add `page.screenshot({ path })`
  only when a picture is the point.
- Keep scripts for this project in `scripts/browser/`, written to the
  scratchpad if they are one-off.
- Uploads: `await page.setInputFiles('input[type=file]', '/absolute/path')`.

## Decisions with Jev

Every script also receives `jev`, the fast decision model (see the `jev` skill).
Let the script collect the items and let Jev judge them, so no page text has to
come back to you just to be sorted:

```js
export default async ({ page, args, jev }) => {
  await page.goto(args[0]);
  const rows = await page.locator('table tr').allTextContents();
  const { answers, cost } = await jev.decideMany(rows, {
    needsAction: { type: 'noul', instructions: 'Does this row report a problem that needs action?' },
  });
  return { cost, flagged: rows.filter((_, i) => answers[i].needsAction.noul > 0.7) };
};
```

- `jev.decide(state, questions)` — one item; returns the answers.
- `jev.decideMany(states, questions)` — the same questions for every item, in one
  round trip; returns `{ answers, cost }`.
- `jev.isSure(noul)` — false when a yes/no answer is too close to 50% to act on.
  Return the unsure items and judge those yourself.

Jev picks between options; it does not click. Use its answer to choose which
branch the script takes (which option to select, which rows to open), never to
decide on its own that something may be submitted or published.

`example-triage.mjs` is a working example.

## The browser profile

The runner uses the installed Google Chrome with its own profile in
`~/.streammatch-playwright`. It does **not** share the user's everyday Chrome
sign-ins. To use a logged-in site, run `--open <url>` once and let the user sign
in themselves; the session is then remembered.

Google may refuse to sign in inside an automated window. If it does, do not try
to work around it — use the Claude in Chrome tools for Google sites, which run
in the user's real browser.

## The user's real Chrome

Scripts here never touch the user's everyday Chrome. For that there is the
Playwright MCP server in `.mcp.json`, started with `--extension`: it attaches to
the user's own Chrome through the "Playwright Extension" from the Chrome Web
Store, so existing sign-ins (2FA, SSO) are available. Its tools appear as
`mcp__playwright__*` in a new session once the extension is installed.

## Rules

- Never type passwords, card numbers or 2FA codes in a script; the user signs in.
- A script must stop before any step that submits, publishes, pays, sends or
  deletes on a real account. Show the user what is about to happen and get a
  yes first, then run the final step as a separate script.
