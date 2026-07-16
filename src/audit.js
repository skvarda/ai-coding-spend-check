const MAX_ROWS = 10_000;

const HEADER_ALIASES = {
  date: ["date", "month", "period"],
  user: ["user", "user_email", "email", "member"],
  provider: ["provider", "vendor", "tool"],
  plan_monthly_cost: ["plan_monthly_cost", "seat_cost", "subscription_cost"],
  usage_cost: ["usage_cost", "overage_cost", "api_cost"],
  active_days: ["active_days", "days_active"],
  commits: ["commits", "commit_count"],
  pull_requests: ["pull_requests", "pr_count", "prs"],
};

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseCsvCells(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new Error("CSV contains an unclosed quoted field");
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replaceAll(" ", "_");
}

function buildColumnMap(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const columnMap = {};

  for (const [canonicalName, aliases] of Object.entries(HEADER_ALIASES)) {
    const columnIndex = normalizedHeaders.findIndex((header) => aliases.includes(header));
    if (columnIndex === -1) {
      throw new Error(`Missing required column: ${canonicalName}`);
    }
    columnMap[canonicalName] = columnIndex;
  }

  return columnMap;
}

function parseNonNegativeNumber(rawValue, fieldName, rowNumber, { integer = false } = {}) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new Error(`Row ${rowNumber}: ${fieldName} must be a non-negative number`);
  }
  return value;
}

function assertValidDate(value, rowNumber) {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(value)) {
    throw new Error(`Row ${rowNumber}: date must use YYYY-MM-DD`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Row ${rowNumber}: date must use YYYY-MM-DD`);
  }
}

export function parseCsv(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new TypeError("CSV input must be a non-empty string");
  }

  const [headers, ...dataRows] = parseCsvCells(input.replace(/^\uFEFF/, ""));
  if (!headers || dataRows.length === 0) {
    throw new Error("CSV must contain a header and at least one data row");
  }
  if (dataRows.length > MAX_ROWS) {
    throw new Error("CSV cannot contain more than 10,000 rows");
  }

  const columns = buildColumnMap(headers);

  return dataRows.map((row, index) => {
    const rowNumber = index + 2;
    const value = (fieldName) => (row[columns[fieldName]] ?? "").trim();
    const date = value("date");
    const user = value("user");
    const provider = value("provider");

    assertValidDate(date, rowNumber);
    if (user === "") {
      throw new Error(`Row ${rowNumber}: user is required`);
    }
    if (provider === "") {
      throw new Error(`Row ${rowNumber}: provider is required`);
    }

    const planMonthlyCost = parseNonNegativeNumber(
      value("plan_monthly_cost"),
      "plan_monthly_cost",
      rowNumber,
    );
    const usageCost = parseNonNegativeNumber(value("usage_cost"), "usage_cost", rowNumber);
    const activeDays = parseNonNegativeNumber(value("active_days"), "active_days", rowNumber, {
      integer: true,
    });
    const commits = parseNonNegativeNumber(value("commits"), "commits", rowNumber, {
      integer: true,
    });
    const pullRequests = parseNonNegativeNumber(
      value("pull_requests"),
      "pull_requests",
      rowNumber,
      { integer: true },
    );

    if (activeDays > 31) {
      throw new Error(`Row ${rowNumber}: active_days cannot exceed 31`);
    }

    return {
      date,
      user,
      provider,
      planMonthlyCost,
      usageCost,
      activeDays,
      commits,
      pullRequests,
      monthlySpend: roundCurrency(planMonthlyCost + usageCost),
    };
  });
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function groupBy(items, keySelector) {
  const groups = new Map();
  for (const item of items) {
    const key = keySelector(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function summarizeSpend(rows, keySelector) {
  return [...groupBy(rows, keySelector)].map(([name, groupedRows]) => ({
    name,
    monthlySpend: roundCurrency(
      groupedRows.reduce((total, row) => total + row.monthlySpend, 0),
    ),
    seats: groupedRows.filter((row) => row.planMonthlyCost > 0).length,
  }));
}

export function analyzeSpend(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError("Spend analysis requires at least one row");
  }

  const calendarMonths = new Set(rows.map((row) => row.date.slice(0, 7)));
  if (calendarMonths.size > 1) {
    throw new Error("Spend analysis accepts one calendar month at a time");
  }

  const totalMonthlySpend = roundCurrency(
    rows.reduce((total, row) => total + row.monthlySpend, 0),
  );
  const totalCommits = rows.reduce((total, row) => total + row.commits, 0);
  const totalPullRequests = rows.reduce((total, row) => total + row.pullRequests, 0);
  const inactiveRows = rows.filter((row) => row.planMonthlyCost > 0 && row.activeDays === 0);
  const activeRows = rows.filter((row) => row.activeDays > 0);
  const activePaidRows = activeRows.filter((row) => row.planMonthlyCost > 0);
  const activeUsers = new Set(activeRows.map((row) => row.user));
  const providers = new Set(rows.map((row) => row.provider));
  const paidSeats = rows.filter((row) => row.planMonthlyCost > 0).length;

  const rowsByUser = groupBy(activePaidRows, (row) => row.user);
  const overlappingUsers = [...rowsByUser]
    .filter(([, userRows]) => new Set(userRows.map((row) => row.provider)).size > 1)
    .map(([user, userRows]) => ({ user, rows: userRows }));

  const overlapMonthly = overlappingUsers.reduce((total, { rows: userRows }) => {
    const cheapestPlan = Math.min(...userRows.map((row) => row.planMonthlyCost));
    return total + cheapestPlan * 0.5;
  }, 0);

  const typicalUsageCost = median(activeRows.map((row) => row.usageCost));
  const outlierQualificationThreshold = Math.max(50, typicalUsageCost * 3);
  const outliers = activeRows
    .filter((row) => row.usageCost > outlierQualificationThreshold)
    .map((row) => ({
      user: row.user,
      provider: row.provider,
      usageCost: row.usageCost,
      monthlySpend: row.monthlySpend,
    }))
    .sort((left, right) => right.usageCost - left.usageCost);

  const outlierUsageMonthly = outliers.reduce((total, outlier) => {
    const reducibleUsage = Math.max(0, outlier.usageCost - typicalUsageCost * 1.5);
    return total + reducibleUsage * 0.25;
  }, 0);

  const inactiveSeatsMonthly = inactiveRows.reduce(
    (total, row) => total + row.planMonthlyCost,
    0,
  );
  const uncappedMonthlySavings =
    inactiveSeatsMonthly + overlapMonthly + outlierUsageMonthly;
  const totalMonthlySavings = Math.min(totalMonthlySpend, uncappedMonthlySavings);

  const findings = [
    {
      type: "inactive-seats",
      title: `${inactiveRows.length} inactive paid seat${inactiveRows.length === 1 ? "" : "s"}`,
      detail: "Paid seats with zero active days are counted at their full monthly plan cost.",
      monthlySavings: roundCurrency(inactiveSeatsMonthly),
    },
    {
      type: "overlap",
      title: `${overlappingUsers.length} user${overlappingUsers.length === 1 ? "" : "s"} on multiple paid tools`,
      detail: "The estimate counts 50% of each overlapping user's cheapest active plan.",
      monthlySavings: roundCurrency(overlapMonthly),
    },
    {
      type: "usage-outliers",
      title: `${outliers.length} high-usage outlier${outliers.length === 1 ? "" : "s"}`,
      detail: "The estimate applies a 25% reduction only to usage above 1.5× the active-seat median.",
      monthlySavings: roundCurrency(outlierUsageMonthly),
    },
  ];

  return {
    summary: {
      totalMonthlySpend,
      annualRunRate: roundCurrency(totalMonthlySpend * 12),
      paidSeats,
      activeUsers: activeUsers.size,
      providerCount: providers.size,
      inactiveSeats: inactiveRows.length,
      overlapUsers: overlappingUsers.length,
      costPerCommit: totalCommits > 0 ? roundCurrency(totalMonthlySpend / totalCommits) : null,
      costPerPullRequest:
        totalPullRequests > 0 ? roundCurrency(totalMonthlySpend / totalPullRequests) : null,
    },
    savings: {
      inactiveSeatsMonthly: roundCurrency(inactiveSeatsMonthly),
      overlapMonthly: roundCurrency(overlapMonthly),
      outlierUsageMonthly: roundCurrency(outlierUsageMonthly),
      totalMonthly: roundCurrency(totalMonthlySavings),
      annual: roundCurrency(totalMonthlySavings * 12),
    },
    findings,
    outliers,
    providerSpend: summarizeSpend(rows, (row) => row.provider).sort(
      (left, right) => right.monthlySpend - left.monthlySpend,
    ),
    userSpend: summarizeSpend(rows, (row) => row.user).sort(
      (left, right) => right.monthlySpend - left.monthlySpend,
    ),
  };
}
