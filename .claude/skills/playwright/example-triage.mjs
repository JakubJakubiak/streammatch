// Example: collect items from a page, then let Jev sort them.
//   node .claude/skills/playwright/run.mjs .claude/skills/playwright/example-triage.mjs http://localhost:5173
export default async ({ page, args, jev }) => {
  await page.goto(args[0]);
  const questions = await page.locator('#faq summary').allTextContents();
  const items = questions.map((text) => text.replace(/\s*\+\s*$/, '').trim());

  const { answers, cost } = await jev.decideMany(items, {
    privacy: {
      type: 'noul',
      instructions: 'Is this question about personal data, privacy or location?',
    },
    topic: {
      type: 'choice',
      instructions: 'What is this question about?',
      criteria: {
        account: 'Signing up, who can join, deleting the account',
        data: 'What data is collected or how precise it is',
        other: 'Anything else',
      },
    },
  });

  return {
    cost,
    items: items.map((text, i) => ({
      text,
      privacy: answers[i].privacy.noul,
      sure: jev.isSure(answers[i].privacy.noul),
      topic: answers[i].topic.choice,
    })),
  };
};
