# AI Coding Spend Check

A private, vendor-neutral first-pass audit for AI coding spend.

The browser tool turns one normalized month of Claude, Codex, Copilot, Cursor, and API data into:

- monthly spend and annual run rate;
- inactive paid seats;
- overlapping vendor subscriptions;
- high-usage outliers;
- cost per commit and pull request;
- conservative savings estimates with visible formulas.

Raw CSV data stays in the browser. There is no backend, database, authentication, tracking SDK, or upload endpoint.

## Live tool

[Run the AI Coding Spend Check](https://skvarda.github.io/ai-coding-spend-check/)

## Local development

```sh
npm ci
npm test
npm run check
npm run build
npm run verify
python3 -m http.server 4173 --directory dist
```

Then open `http://localhost:4173/`.

## CSV contract

Use [the template](public/template.csv) with one row per user and provider for one calendar month:

```csv
date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,alex@example.com,Claude Code,100,25,18,32,7
```

Files are capped at 5 MB and 10,000 rows. Invalid dates, negative values, and mixed calendar months are rejected.

## Research and decision record

- [Product spec](docs/spec.md)
- [Market research synthesis](docs/research.md)

The initial direction came from 747 dated AI Pulse Daily reports across Reddit, Twitter, Hacker News, and YouTube, followed by a competitor review that ruled out another commodity token tracker.

## Founding audit

The paid offer is a $250 human-reviewed audit for teams using multiple AI coding vendors. Payment is due only if the audit identifies at least $500 in credible annual savings. [Request an audit](mailto:sean@stateofgtm.com?subject=Founding%20AI%20coding%20spend%20audit).

## Feedback

[Share product feedback](https://github.com/skvarda/ai-coding-spend-check/issues/new?template=feedback.yml) without posting vendor exports, employee names, account identifiers, or other private data.
