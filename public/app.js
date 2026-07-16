import { analyzeSpend, parseCsv } from "./audit.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SAMPLE_CSV = `date,user,provider,plan_monthly_cost,usage_cost,active_days,commits,pull_requests
2026-06-01,alice@example.com,Claude Code,100,20,18,30,8
2026-06-01,alice@example.com,Codex,20,5,5,10,2
2026-06-01,bob@example.com,Claude Code,100,0,0,0,0
2026-06-01,carol@example.com,GitHub Copilot,39,0,12,20,4
2026-06-01,dave@example.com,Cursor,40,300,20,5,1
2026-06-01,eve@example.com,Codex,20,0,5,12,3`;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
}

function setText(id, value) {
  byId(id).textContent = value;
}

function renderFindings(findings) {
  const list = byId("findings-list");
  list.replaceChildren();

  for (const finding of findings) {
    const item = document.createElement("li");
    const heading = document.createElement("div");
    const title = document.createElement("strong");
    const savings = document.createElement("span");
    const detail = document.createElement("p");

    title.textContent = finding.title;
    savings.textContent = `${currency.format(finding.monthlySavings)}/mo`;
    detail.textContent = finding.detail;
    heading.append(title, savings);
    item.append(heading, detail);
    list.append(item);
  }
}

function renderProviderBars(providers) {
  const container = byId("provider-bars");
  const maximumSpend = Math.max(...providers.map((provider) => provider.monthlySpend), 1);
  container.replaceChildren();

  for (const provider of providers) {
    const row = document.createElement("div");
    const label = document.createElement("div");
    const name = document.createElement("span");
    const value = document.createElement("strong");
    const track = document.createElement("div");
    const bar = document.createElement("span");

    row.className = "provider-row";
    label.className = "provider-label";
    track.className = "bar-track";
    bar.className = "bar-fill";
    name.textContent = provider.name;
    value.textContent = currency.format(provider.monthlySpend);
    bar.style.width = `${Math.max(2, (provider.monthlySpend / maximumSpend) * 100)}%`;
    label.append(name, value);
    track.append(bar);
    row.append(label, track);
    container.append(row);
  }
}

function renderAnalysis(analysis, sourceLabel) {
  setText("monthly-spend", currency.format(analysis.summary.totalMonthlySpend));
  setText("annual-run-rate", currency.format(analysis.summary.annualRunRate));
  setText("annual-savings", currency.format(analysis.savings.annual));
  setText("paid-seats", String(analysis.summary.paidSeats));
  setText(
    "cost-per-commit",
    analysis.summary.costPerCommit === null ? "Not reported" : currency.format(analysis.summary.costPerCommit),
  );
  setText(
    "cost-per-pr",
    analysis.summary.costPerPullRequest === null
      ? "Not reported"
      : currency.format(analysis.summary.costPerPullRequest),
  );
  setText("active-users", String(analysis.summary.activeUsers));
  setText("provider-count", String(analysis.summary.providerCount));
  renderFindings(analysis.findings);
  renderProviderBars(analysis.providerSpend);

  byId("results").hidden = false;
  setText("status", `${sourceLabel} analyzed locally. No rows were uploaded.`);
  byId("results-title").focus();
}

function analyzeCsv(csv, sourceLabel) {
  try {
    renderAnalysis(analyzeSpend(parseCsv(csv)), sourceLabel);
  } catch (error) {
    byId("results").hidden = true;
    setText("status", error instanceof Error ? error.message : "The CSV could not be analyzed.");
  }
}

function loadSample() {
  analyzeCsv(SAMPLE_CSV, "Sample data");
  byId("analyzer").scrollIntoView({ behavior: "smooth", block: "start" });
}

byId("sample-top").addEventListener("click", loadSample);
byId("sample-analyzer").addEventListener("click", loadSample);
byId("print-report").addEventListener("click", () => window.print());

byId("csv-file").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    byId("results").hidden = true;
    setText("status", "The file is larger than 5 MB. Use one month or remove unneeded columns.");
    return;
  }

  setText("status", `Reading ${file.name} locally…`);
  analyzeCsv(await file.text(), file.name);
});
