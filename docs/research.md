# Research: Why AI Coding Spend Check

## Corpus

On 2026-07-16, the public `genisisiq.com` sitemap exposed 756 English URLs. The research crawl successfully parsed 747 dated reports from 2026-04-07 through 2026-07-15:

- Reddit: 290 reports
- Twitter: 279 reports
- Hacker News: 100 reports
- YouTube: 78 reports
- Broad AI: 367 reports
- AI agents: 193 reports
- AI coding: 187 reports

The daily reports consistently separate observed discussion, frustrations, requested products, tools, projects, and ranked opportunities. Report-level keyword scoring was applied only to the frustration, wish-list, and opportunity sections.

## Strongest repeated commercial signals

The most persistent cross-source opportunity families were:

1. production reliability and evaluation;
2. AI cost, quota, and routing control;
3. security, permissions, and governance;
4. multi-agent orchestration and operating layers;
5. context, memory, and session continuity.

Cost and quota control appeared in 698 of 747 reports under a deliberately broad report-level classifier, including 342 top-ranked (`[+++]`) opportunity titles. The signal intensified in the final week with titles such as:

- “Spend governance and routing control for coding agents”;
- “Output-aware ROI and budget control”;
- “Quota observability, workload routing, and reset planning”;
- “Shared quota governance and reset-aware planning”;
- “Agent spend and runway control planes.”

The public archive also contains concrete team-level pain: hidden personal usage, budget exhaustion within days, vendor migration driven by limits, and uncontrolled agent fan-out.

## Why not build another tracker

Current market review found numerous free, open-source individual usage trackers, including OpenUsage, CodeBurn, ClaudeBar, onWatch, and provider-specific dashboards. Anthropic also added enterprise analytics, exports, API access, spend caps, and value metrics in July 2026.

A new local token counter would be undifferentiated. The remaining wedge is cross-vendor decision support tied to business output:

- combine multiple vendors rather than instrument only one;
- find duplicate seats and inactive subscriptions;
- compare spend with commits and pull requests;
- produce a finance-ready savings narrative;
- begin as an audit that can accommodate messy exports manually.

## Offer design

The free analyzer proves competence and protects privacy. The paid audit supplies the human judgment that a generic tracker cannot:

- normalize exports from multiple vendors;
- separate useful redundancy from waste;
- flag misleading metrics and missing data;
- recommend seat, routing, and policy changes;
- produce an executive summary and 30-day action plan.

Founding price: **$250**, payable only when the analysis identifies at least **$500/year** in credible savings.

## Free-for-dev infrastructure choices

The `ripienaar/free-for-dev` repository was inspected at README revision `35da168fc1f7bedeae0d4fa7a92dd44704657cc2`, then refreshed from the current default branch.

Selected v1 stack:

- **Static hosting:** GitHub Pages first because the product has no server requirements. Cloudflare Pages, Netlify, Vercel, or Kinsta remain free-tier fallbacks.
- **Lead capture:** direct email replies during outbound validation. If an embedded form becomes useful, Tally's free plan supports unlimited forms and submissions, while Web3Forms and Formspree support static sites.
- **Email:** Gmail for one-to-one validation. Brevo, MailerLite, Resend, or Buttondown are free-tier options only after permission-based follow-up volume exists.
- **Analytics:** none at launch to preserve privacy and minimize setup. Cloudflare Web Analytics, Umami, Rybbit, Seline, or PostHog are available if aggregate funnel data becomes necessary.
- **Monitoring:** Better Stack or UptimeRobot after publication; both have sufficient free monitoring for one static site.
- **Error handling:** no external SDK in v1. Sentry, GlitchTip, Bugsink, or Honeybadger are free-tier options if client-side complexity grows.
- **Payments:** defer processor setup until a prospect accepts the offer. The directory's payment section is oriented toward product billing infrastructure, while the first sale can use an invoice or existing payment account without adding application code.

## Decision rule

Do not expand into a SaaS dashboard until outreach proves at least one of these:

- buyers repeat the audit monthly;
- a native export importer is requested by multiple teams;
- a buyer asks for shared history, alerts, procurement controls, or automated routing;
- the manual audit closes and exposes a repeatable data contract.

Until then, sell the outcome and keep the software local, legible, and cheap.
