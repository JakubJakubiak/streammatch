---
name: jev
description: Fast, cheap batch decisions with Jev (TypeSafe's decision model on OpenRouter). Use when many small yes/no, pick-one or rate-on-a-scale judgements are needed over text — triaging lists scraped from a web page (apps, notifications, reviews, form fields), checking each item against a rule, moderating messages or bios, or screening a planned action for risk before doing it. Not for writing text, reasoning, or reading screenshots.
---

# Jev — quick decisions

Jev answers closed questions about one piece of state in about a second for a
fraction of a cent. It does not generate text and cannot see images: give it the
text (or JSON) to judge and the questions to answer.

The OpenRouter key lives only on the Convex deployment (`OPENROUTER_API_KEY`), so
calls go through the `ai:decide` action. Run from the project root:

```bash
npx convex run ai:decide '{"state": <text or JSON>, "questions": { ... }}'
```

Check the key first if a call fails: `npx convex run ai:checkKey`.

## Question types

Every question has `type` and `instructions`. Keys are names you choose.

| type | extra field | answer |
|---|---|---|
| `noul` | — | `noul`: probability of yes, 0–1 |
| `choice` | `criteria`: `{option: description}` (2–255 options) | `choice` + `confidence` + per-option `probabilities` |
| `score` | `criteria`: ordered array, lowest to highest (2–10 levels) | `score` (weighted position) + `probabilities` |

```json
{
  "state": "Hej! Kup followersów tanio, link w bio",
  "questions": {
    "spam": { "type": "noul", "instructions": "Is this message spam or advertising?" },
    "tone": {
      "type": "choice",
      "instructions": "What is the tone of this message?",
      "criteria": { "friendly": "Warm personal message", "promotional": "Selling something", "hostile": "Insulting or threatening" }
    }
  }
}
```

All questions in one call are judged against the same `state`. For a list of
items, make one call per item with the same questions.

## Using it while driving a browser

Jev does not click or navigate. The pattern is:

1. Read the page as text (`get_page_text` / `read_page`).
2. Split it into items and ask Jev the same closed questions about each.
3. Act on the answers yourself, and still confirm with the user before anything
   that submits, publishes, sends or deletes.

Treat a `noul` between roughly 0.3 and 0.7, or a low `confidence`, as "unsure":
look at that item yourself instead of trusting the answer.

## Limits

- Text and JSON only.
- Answers are probabilities, not explanations. If the reason matters, decide it yourself.
- Never put secrets or more personal data than the question needs into `state`.
