// Example script: returns the title and headings of a page.
//   node .claude/skills/playwright/run.mjs .claude/skills/playwright/example-page-info.mjs http://localhost:5173
export default async ({ page, args }) => {
  await page.goto(args[0]);
  return {
    title: await page.title(),
    headings: await page.locator('h1, h2').allTextContents(),
  };
};
