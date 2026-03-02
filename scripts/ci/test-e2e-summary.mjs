#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSummaryLines } from "./e2e-summary.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportFixturePath = path.join(__dirname, "fixtures", "e2e-summary-report-mock.json");
const historyFixturePath = path.join(__dirname, "fixtures", "e2e-summary-history-mock.json");
const failingFirstHistoryFixturePath = path.join(
  __dirname,
  "fixtures",
  "e2e-summary-history-failing-first.json",
);
const reportFixture = JSON.parse(fs.readFileSync(reportFixturePath, "utf8"));

function makeEnv(overrides = {}) {
  return {
    ...process.env,
    GITHUB_TOKEN: "",
    GITHUB_REPOSITORY: "",
    GITHUB_REF_NAME: "",
    GITHUB_STEP_SUMMARY: "",
    E2E_SUMMARY_MOCK_HISTORY_FILE: "",
    E2E_STREAK_SCAN_LIMIT: "",
    ...overrides,
  };
}

async function runFallbackCase() {
  const lines = await buildSummaryLines(reportFixture, makeEnv());
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `1\/5` \(fallback-local\)/);
  assert.match(output, /Streak Scan Window: `0\/100` completed CI runs/);
  assert.match(output, /\| `e2e\/auth\.spec\.ts` \| 2 \| 0 \| 1 \| 0 \| 0 \|/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runFallbackDirtyCase() {
  const dirtyReport = {
    ...reportFixture,
    stats: {
      ...reportFixture.stats,
      expected: 2,
      unexpected: 1,
      skipped: 1,
      flaky: 0,
    },
  };
  const lines = await buildSummaryLines(dirtyReport, makeEnv());
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `0\/5` \(fallback-local\)/);
  assert.match(output, /Error Rate: `33.33%`/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runHistoryDerivedCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `3\/250` completed CI runs/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runHistoryDerivedDirtyReportCase() {
  const dirtyReport = {
    ...reportFixture,
    stats: {
      ...reportFixture.stats,
      expected: 2,
      unexpected: 1,
      skipped: 1,
      flaky: 0,
    },
  };
  const lines = await buildSummaryLines(
    dirtyReport,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /Error Rate: `33.33%`/);
}

async function runHistoryDerivedFailingFirstCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: failingFirstHistoryFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `0\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `1\/250` completed CI runs/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runScanLimitTruncationCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "2",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `2\/2` completed CI runs/);
  assert.match(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runMissingMockHistoryFileCase() {
  await assert.rejects(
    () =>
      buildSummaryLines(
        reportFixture,
        makeEnv({
          E2E_SUMMARY_MOCK_HISTORY_FILE: path.join(__dirname, "fixtures", "does-not-exist.json"),
        }),
      ),
    /E2E summary mock history file not found/,
  );
}

async function runInvalidMockHistoryFileCase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-invalid-"));
  const invalidPath = path.join(tempDir, "invalid.json");
  fs.writeFileSync(invalidPath, "{not-json");

  try {
    await assert.rejects(
      () =>
        buildSummaryLines(
          reportFixture,
          makeEnv({
            E2E_SUMMARY_MOCK_HISTORY_FILE: invalidPath,
          }),
        ),
      /E2E summary mock history file is not valid JSON/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

await runFallbackCase();
await runFallbackDirtyCase();
await runHistoryDerivedCase();
await runHistoryDerivedDirtyReportCase();
await runHistoryDerivedFailingFirstCase();
await runScanLimitTruncationCase();
await runMissingMockHistoryFileCase();
await runInvalidMockHistoryFileCase();
console.log("e2e-summary self-test passed");
