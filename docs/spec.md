# Spec: AI Coding Spend Check

## Objective

Build a privacy-first acquisition tool and productized audit for engineering leaders at 10–100 person companies using two or more AI coding vendors.

The free tool analyzes a normalized CSV entirely in the browser and produces a board-ready view of:

- monthly AI coding spend;
- active and inactive paid seats;
- users with overlapping vendor subscriptions;
- unusually expensive users or workflows;
- cost per commit and pull request when output data is available;
- conservative annual savings opportunities with transparent formulas.

The paid founding offer is a human-reviewed, vendor-neutral audit for **$250**, charged only when the audit identifies at least **$500 in credible annual savings**. The buyer receives a print-ready report and a prioritized 30-day action plan. No raw usage export needs to leave the buyer's machine; a screen-share or locally generated summary is sufficient.

## Assumptions

1. The fastest path to revenue is a productized service supported by software, not a multi-tenant SaaS.
2. Engineering managers, heads of engineering, and technical founders are the first buyer profile.
3. Privacy is part of the offer: usage data stays in the browser and is not uploaded.
4. The initial analyzer accepts one normalized CSV format and a downloadable template. Vendor-specific importers are added only after a real prospect supplies a redacted export.
5. The site can launch on a free static-hosting tier and outreach can use direct replies before a public lead form or payment integration is necessary.

## Tech Stack

- Standards-based HTML, CSS, and JavaScript modules; no runtime framework.
- Node.js built-in test runner (`node:test`) for parsing and analysis logic.
- Browser `FileReader` for local CSV ingestion.
- Static hosting compatible with GitHub Pages, Cloudflare Pages, Netlify, or Vercel.
- No database, authentication, analytics SDK, cookies, or server-side upload path in v1.

## Commands

- Develop: `python3 -m http.server 4173 --directory public`
- Test: `npm test`
- Build: `npm run build`
- Lint/check: `npm run check`
- Verify generated site: `npm run verify`

## Project Structure

```text
docs/
  spec.md                 Product and implementation contract
  research.md             Corpus evidence and market decision
public/
  index.html              Customer-facing page and analyzer shell
  styles.css              Responsive visual system
  app.js                  Browser interaction only
src/
  audit.js                Pure CSV parsing and spend-analysis logic
tests/
  audit.test.js           Unit tests for all analysis behavior
scripts/
  build.mjs               Dependency-free static build
  verify.mjs              Structural and security checks
dist/                     Generated, not committed
```

## Code Style

Use small pure functions, immutable return values, descriptive names, and explicit validation at trust boundaries.

```js
export function estimateAnnualSavings(monthlySavings) {
  if (!Number.isFinite(monthlySavings) || monthlySavings < 0) {
    throw new TypeError("monthlySavings must be a non-negative number");
  }

  return Math.round(monthlySavings * 12);
}
```

User-provided values are rendered with `textContent`, never `innerHTML`.

## Testing Strategy

- Unit tests cover quoted CSV fields, malformed rows, numeric validation, date handling, overlapping subscriptions, inactive seats, outlier detection, savings caps, and empty datasets.
- Tests are written before each behavior and must fail for the expected reason before implementation.
- A build verification script checks required assets, security-sensitive DOM patterns, and generated output.
- Final runtime verification covers the sample-data flow, file upload, print report, mobile layout, keyboard navigation, and a clean browser console.

## Threat Model

### Trust boundaries

- Uploaded CSV text is untrusted.
- URL fragments and query parameters are untrusted.
- Any future form, email, analytics, or payment integration is external and untrusted.

### Assets

- Employee identity and usage data in exports.
- The buyer's budget and vendor-spend information.
- The credibility of savings recommendations.

### Primary abuse cases and controls

- Oversized or malicious CSV causes browser exhaustion: cap files at 5 MB and rows at 10,000.
- Spreadsheet content injects markup or script: parse as data and render only with `textContent`.
- Misleading negative or extreme values distort recommendations: reject invalid numerics and cap savings at observed spend.
- Raw exports leak to a third party: no network submission path; analysis runs locally.
- Formula injection in downloaded CSV: v1 does not export user-controlled CSV cells.

## Boundaries

### Always

- Keep raw customer data in-browser.
- Show formulas and assumptions behind every savings estimate.
- Run tests, build checks, dependency audit, and browser verification before release.
- Make the free tool useful without requiring an email.

### Ask first

- Store raw usage data on a server.
- Add authentication, payment processing, or a new third-party integration that handles customer data.
- Change the savings guarantee or paid price after outreach begins.

### Never

- Commit secrets or customer exports.
- Claim savings that are not supported by the uploaded data and documented formulas.
- Render uploaded content as HTML.
- Present the tool as formal accounting, tax, legal, or procurement advice.

## Success Criteria

- A visitor can load sample data and understand the offer in under 60 seconds.
- A visitor can upload the template CSV and receive an analysis without a network request.
- The report shows spend, overlap, inactive seats, outliers, output efficiency, and conservative annual savings.
- The analysis explains how each recommendation was calculated.
- The page works at 320 px, 768 px, 1024 px, and 1440 px widths and is keyboard accessible.
- Tests, build, checks, and browser console are clean.
- The static site is published on a free tier.
- At least 20 qualified, personalized prospect contacts are attempted and replies are tracked.
- The goal is complete only when a paying customer completes the founding audit, or after a repeated external blocker meets the goal-blocking threshold.

## Open Questions

- Which vendor export format should receive the first native importer? Let the first serious prospect decide.
- Which payment rail should be used? Defer until a prospect accepts the audit; do not force financial onboarding before demand.
- Which custom domain is worth buying? Defer until the offer earns a reply or sale.
