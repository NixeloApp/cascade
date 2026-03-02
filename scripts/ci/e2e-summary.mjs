#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const TREND_TARGET = 5;
const DEFAULT_RUN_SCAN_LIMIT = 100;
const RUNS_PAGE_SIZE = 50;

function usage() {
  console.error("Usage: node scripts/ci/e2e-summary.mjs <merged-report.json>");
}

function ensure(byFile, file) {
  if (!byFile.has(file)) {
    byFile.set(file, {
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      timedOut: 0,
      interrupted: 0,
    });
  }
  return byFile.get(file);
}

export function parseScanLimit(env = process.env) {
  const scanLimitRaw = Number.parseInt(env.E2E_STREAK_SCAN_LIMIT || "", 10);
  return Number.isFinite(scanLimitRaw) && scanLimitRaw > 0 ? scanLimitRaw : DEFAULT_RUN_SCAN_LIMIT;
}

export function accumulateBySpec(report) {
  const byFile = new Map();

  function visitSuite(suite) {
    for (const spec of suite.specs || []) {
      const row = ensure(byFile, spec.file);
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (result.status === "passed") row.passed += 1;
          else if (result.status === "failed") row.failed += 1;
          else if (result.status === "skipped") row.skipped += 1;
          else if (result.status === "flaky") row.flaky += 1;
          else if (result.status === "timedOut") row.timedOut += 1;
          else if (result.status === "interrupted") row.interrupted += 1;
        }
      }
    }

    for (const child of suite.suites || []) {
      visitSuite(child);
    }
  }

  for (const suite of report.suites || []) {
    visitSuite(suite);
  }

  const rows = [...byFile.entries()].map(([file, data]) => ({
    file,
    ...data,
    total: data.passed + data.failed + data.skipped + data.flaky + data.timedOut + data.interrupted,
  }));

  rows.sort(
    (a, b) =>
      b.failed - a.failed ||
      b.timedOut - a.timedOut ||
      b.flaky - a.flaky ||
      b.skipped - a.skipped ||
      a.file.localeCompare(b.file),
  );

  return rows;
}

export async function computeConsecutiveCleanRuns(env = process.env) {
  const scanLimit = parseScanLimit(env);
  const mockHistoryPath = env.E2E_SUMMARY_MOCK_HISTORY_FILE;
  if (mockHistoryPath) {
    const mock = JSON.parse(fs.readFileSync(mockHistoryPath, "utf8"));
    const runs = (mock.workflow_runs || []).slice(0, scanLimit);
    const jobsByRun = mock.jobs_by_run || {};
    let streak = 0;
    let scannedRuns = 0;

    for (const run of runs) {
      scannedRuns += 1;
      const jobsPayload = jobsByRun[String(run.id)] || { jobs: [] };
      const e2eJobs = (jobsPayload.jobs || []).filter((job) => job.name.startsWith("E2E Tests"));
      if (e2eJobs.length === 0) {
        continue;
      }

      const isCleanRun = e2eJobs.every((job) => job.conclusion === "success");
      if (!isCleanRun) {
        break;
      }

      streak += 1;
    }

    return { streak, scannedRuns };
  }

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPOSITORY;
  const branch = env.GITHUB_REF_NAME;
  if (!token || !repo || !branch) {
    return null;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "nixelo-e2e-summary",
  };

  const runs = [];
  let page = 1;

  while (runs.length < scanLimit) {
    const runsResponse = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/ci.yml/runs?branch=${encodeURIComponent(
        branch,
      )}&status=completed&per_page=${RUNS_PAGE_SIZE}&page=${page}`,
      { headers },
    );
    if (!runsResponse.ok) {
      return null;
    }

    const runsPayload = await runsResponse.json();
    const pageRuns = runsPayload.workflow_runs || [];
    if (pageRuns.length === 0) {
      break;
    }

    runs.push(...pageRuns);
    if (pageRuns.length < RUNS_PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  if (runs.length > scanLimit) {
    runs.length = scanLimit;
  }

  let streak = 0;
  let scannedRuns = 0;

  for (const run of runs) {
    scannedRuns += 1;
    const jobsResponse = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`,
      { headers },
    );
    if (!jobsResponse.ok) {
      break;
    }

    const jobsPayload = await jobsResponse.json();
    const e2eJobs = (jobsPayload.jobs || []).filter((job) => job.name.startsWith("E2E Tests"));
    if (e2eJobs.length === 0) {
      continue;
    }

    const isCleanRun = e2eJobs.every((job) => job.conclusion === "success");
    if (!isCleanRun) {
      break;
    }

    streak += 1;
  }

  return { streak, scannedRuns };
}

function appendSummary(lines, env = process.env) {
  const summaryPath = env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
  } else {
    console.log(lines.join("\n"));
  }
}

export async function buildSummaryLines(report, env = process.env) {
  const rows = accumulateBySpec(report);

  const stats = report.stats || {};
  const passed = Number(stats.expected || 0);
  const failed = Number(stats.unexpected || 0);
  const skipped = Number(stats.skipped || 0);
  const flaky = Number(stats.flaky || 0);
  const executed = passed + failed;
  const errorRate = executed > 0 ? ((failed / executed) * 100).toFixed(2) : "0.00";

  const cleanRun = failed === 0 && flaky === 0;
  const streakSummary = await computeConsecutiveCleanRuns(env);
  const runStreak = streakSummary?.streak ?? (cleanRun ? 1 : 0);
  const checkpointMode = streakSummary === null ? "fallback-local" : "history-derived";
  const scannedRuns = streakSummary?.scannedRuns ?? 0;
  const scanLimit = parseScanLimit(env);
  const scanWindowPotentiallyTruncated =
    checkpointMode === "history-derived" && scannedRuns === scanLimit && runStreak === scannedRuns;

  const lines = [];
  lines.push("## E2E Heatmap");
  lines.push("");
  lines.push(
    `- Totals: \`${passed} passed\`, \`${failed} failed\`, \`${skipped} skipped\`, \`${flaky} flaky\``,
  );
  lines.push(`- Executed: \`${executed}\` (pass + fail)`);
  lines.push(`- Error Rate: \`${errorRate}%\``);
  lines.push(`- Clean-Run Checkpoint: \`${runStreak}/${TREND_TARGET}\` (${checkpointMode})`);
  lines.push(`- Streak Scan Window: \`${scannedRuns}/${scanLimit}\` completed CI runs`);
  if (scanWindowPotentiallyTruncated) {
    lines.push(
      "- Streak Coverage Note: `possibly-truncated` (increase `E2E_STREAK_SCAN_LIMIT` if needed)",
    );
  }
  lines.push("");
  lines.push("| Spec | Passed | Failed | Skipped | Flaky | TimedOut |");
  lines.push("|------|--------|--------|---------|-------|----------|");
  for (const row of rows) {
    lines.push(
      `| \`${row.file}\` | ${row.passed} | ${row.failed} | ${row.skipped} | ${row.flaky} | ${row.timedOut} |`,
    );
  }
  lines.push("");

  return lines;
}

export async function run(reportPath, env = process.env) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const lines = await buildSummaryLines(report, env);
  appendSummary(lines, env);
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    usage();
    process.exit(1);
  }

  await run(reportPath);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
