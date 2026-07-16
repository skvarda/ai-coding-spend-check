import assert from "node:assert/strict";
import test from "node:test";

import { analyzeSpend, parseCsv } from "../src/audit.js";

const sampleCsv = `date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,alice@example.com,Claude Code,100,20,18,30,8
2026-06-01,alice@example.com,Codex,20,5,5,10,2
2026-06-01,bob@example.com,Claude Code,100,0,0,0,0
2026-06-01,carol@example.com,GitHub Copilot,39,0,12,20,4
2026-06-01,dave@example.com,Cursor,40,300,20,5,1
2026-06-01,eve@example.com,Codex,20,0,5,12,3`;

test("parseCsv parses quoted commas and escaped quotes", () => {
  const rows = parseCsv(`date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,alice@example.com,"Acme, \"\"Enterprise\"\"",100,25,10,12,3`);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].provider, 'Acme, "Enterprise"');
  assert.equal(rows[0].monthlySpend, 125);
});

test("parseCsv accepts common vendor export header aliases", () => {
  const rows = parseCsv(`month,user_email,vendor,seat_cost,overage_cost,days_active,commit_count,pr_count
2026-06-01,alice@example.com,Codex,20,4,8,14,3`);

  assert.deepEqual(rows[0], {
    date: "2026-06-01",
    user: "alice@example.com",
    provider: "Codex",
    planMonthlyCost: 20,
    usageCost: 4,
    activeDays: 8,
    commits: 14,
    pullRequests: 3,
    monthlySpend: 24,
  });
});

test("parseCsv rejects missing required columns", () => {
  assert.throws(
    () => parseCsv("date,user,provider\n2026-06-01,a@example.com,Codex"),
    /Missing required column: plan_monthly_cost/,
  );
});

test("parseCsv rejects negative and non-numeric values", () => {
  assert.throws(
    () => parseCsv(`date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,a@example.com,Codex,-20,free,3,4,1`),
    /plan_monthly_cost must be a non-negative number/,
  );
});

test("parseCsv caps the input at 10,000 data rows", () => {
  const header = "date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests";
  const dataRow = "2026-06-01,a@example.com,Codex,20,0,1,1,0";
  const csv = [header, ...Array.from({ length: 10_001 }, () => dataRow)].join("\n");

  assert.throws(() => parseCsv(csv), /10,000 rows/);
});

test("analyzeSpend identifies inactive seats, overlap, outliers, and output efficiency", () => {
  const analysis = analyzeSpend(parseCsv(sampleCsv));

  assert.deepEqual(analysis.summary, {
    totalMonthlySpend: 644,
    annualRunRate: 7728,
    paidSeats: 6,
    activeUsers: 4,
    providerCount: 4,
    inactiveSeats: 1,
    overlapUsers: 1,
    costPerCommit: 8.36,
    costPerPullRequest: 35.78,
  });
  assert.equal(analysis.outliers.length, 1);
  assert.equal(analysis.outliers[0].user, "dave@example.com");
  assert.equal(analysis.savings.inactiveSeatsMonthly, 100);
  assert.equal(analysis.savings.overlapMonthly, 10);
  assert.equal(analysis.savings.outlierUsageMonthly, 73.13);
  assert.equal(analysis.savings.totalMonthly, 183.13);
  assert.equal(analysis.savings.annual, 2197.5);
});

test("analyzeSpend returns null efficiency metrics when no output is reported", () => {
  const rows = parseCsv(`date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,a@example.com,Codex,20,0,2,0,0`);

  const analysis = analyzeSpend(rows);

  assert.equal(analysis.summary.costPerCommit, null);
  assert.equal(analysis.summary.costPerPullRequest, null);
});

test("analyzeSpend rejects an empty dataset", () => {
  assert.throws(() => analyzeSpend([]), /at least one row/);
});
