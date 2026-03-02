#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSummaryLines, run as runSummary } from "./e2e-summary.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportFixturePath = path.join(__dirname, "fixtures", "e2e-summary-report-mock.json");
const historyFixturePath = path.join(__dirname, "fixtures", "e2e-summary-history-mock.json");
const failingFirstHistoryFixturePath = path.join(
  __dirname,
  "fixtures",
  "e2e-summary-history-failing-first.json",
);
const noE2EJobsHistoryFixturePath = path.join(
  __dirname,
  "fixtures",
  "e2e-summary-history-no-e2e-jobs.json",
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
  assert.match(
    output,
    /\| Spec \| Passed \| Failed \| Skipped \| Flaky \| TimedOut \| Interrupted \|/,
  );
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

async function runFallbackFlakyCase() {
  const flakyReport = {
    ...reportFixture,
    stats: {
      ...reportFixture.stats,
      expected: 2,
      unexpected: 0,
      skipped: 1,
      flaky: 1,
    },
  };
  const lines = await buildSummaryLines(flakyReport, makeEnv());
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `0\/5` \(fallback-local\)/);
  assert.match(output, /- Totals: `2 passed`, `0 failed`, `1 skipped`, `1 flaky`, `0 interrupted`/);
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

async function runHistoryDerivedFlakyReportCase() {
  const flakyReport = {
    ...reportFixture,
    stats: {
      ...reportFixture.stats,
      expected: 2,
      unexpected: 0,
      skipped: 1,
      flaky: 1,
    },
  };
  const lines = await buildSummaryLines(
    flakyReport,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /- Totals: `2 passed`, `0 failed`, `1 skipped`, `1 flaky`, `0 interrupted`/);
}

async function runInterruptedResultCase() {
  const interruptedReport = JSON.parse(JSON.stringify(reportFixture));
  interruptedReport.stats = {
    ...interruptedReport.stats,
    expected: 2,
    unexpected: 0,
    skipped: 1,
    flaky: 0,
    interrupted: 1,
  };
  interruptedReport.suites[0].specs[1].tests[0].results = [{ status: "interrupted" }];

  const lines = await buildSummaryLines(interruptedReport, makeEnv());
  const output = lines.join("\n");

  assert.match(output, /- Totals: `2 passed`, `0 failed`, `1 skipped`, `0 flaky`, `1 interrupted`/);
  assert.match(output, /\| `e2e\/issues\.spec\.ts` \| 0 \| 0 \| 0 \| 0 \| 0 \| 1 \|/);
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

async function runInvalidScanLimitFallbackCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "not-a-number",
    }),
  );
  const output = lines.join("\n");

  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `3\/100` completed CI runs/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
}

async function runNonPositiveScanLimitFallbackCase() {
  const zeroLimitLines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "0",
    }),
  );
  const zeroLimitOutput = zeroLimitLines.join("\n");
  assert.match(zeroLimitOutput, /Streak Scan Window: `3\/100` completed CI runs/);

  const negativeLimitLines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "-7",
    }),
  );
  const negativeLimitOutput = negativeLimitLines.join("\n");
  assert.match(negativeLimitOutput, /Streak Scan Window: `3\/100` completed CI runs/);
}

async function runMixedTokenScanLimitFallbackCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250abc",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Streak Scan Window: `3\/100` completed CI runs/);
}

async function runTrimmedValidScanLimitCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: " 250 ",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Streak Scan Window: `3\/250` completed CI runs/);
}

async function runOversizedScanLimitFallbackCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "9007199254740993",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Streak Scan Window: `3\/100` completed CI runs/);
}

async function runLeadingZeroScanLimitFallbackCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "010",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Streak Scan Window: `3\/100` completed CI runs/);
}

async function runExcessiveSafeScanLimitCapCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
      E2E_STREAK_SCAN_LIMIT: "5000",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Streak Scan Window: `3\/1000` completed CI runs/);
}

async function runHistoryDerivedNoE2EJobsCase() {
  const lines = await buildSummaryLines(
    reportFixture,
    makeEnv({
      E2E_SUMMARY_MOCK_HISTORY_FILE: noE2EJobsHistoryFixturePath,
      E2E_STREAK_SCAN_LIMIT: "250",
    }),
  );
  const output = lines.join("\n");
  assert.match(output, /Clean-Run Checkpoint: `0\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `2\/250` completed CI runs/);
  assert.doesNotMatch(output, /Streak Coverage Note: `possibly-truncated`/);
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

async function runUnreadableMockHistoryFileCase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-unreadable-mock-"));
  const unreadablePath = path.join(tempDir, "unreadable.json");
  fs.writeFileSync(unreadablePath, "{}");
  fs.chmodSync(unreadablePath, 0o000);

  try {
    await assert.rejects(
      () =>
        buildSummaryLines(
          reportFixture,
          makeEnv({
            E2E_SUMMARY_MOCK_HISTORY_FILE: unreadablePath,
          }),
        ),
      /E2E summary mock history file unreadable/,
    );
  } finally {
    fs.chmodSync(unreadablePath, 0o600);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runMissingReportFileCase() {
  await assert.rejects(
    () => runSummary(path.join(__dirname, "fixtures", "does-not-exist-report.json"), makeEnv()),
    /E2E summary report file not found/,
  );
}

async function runInvalidReportFileCase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-invalid-report-"));
  const invalidPath = path.join(tempDir, "invalid-report.json");
  fs.writeFileSync(invalidPath, "{not-json");

  try {
    await assert.rejects(
      () => runSummary(invalidPath, makeEnv()),
      /E2E summary report file is not valid JSON/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runUnreadableReportFileCase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-unreadable-report-"));
  const unreadablePath = path.join(tempDir, "unreadable-report.json");
  fs.writeFileSync(unreadablePath, "{}");
  fs.chmodSync(unreadablePath, 0o000);

  try {
    await assert.rejects(
      () => runSummary(unreadablePath, makeEnv()),
      /E2E summary report file unreadable/,
    );
  } finally {
    fs.chmodSync(unreadablePath, 0o600);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runStepSummaryWriteCase() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-summary-step-summary-"));
  const summaryPath = path.join(tempDir, "step-summary.md");

  try {
    await runSummary(
      reportFixturePath,
      makeEnv({
        GITHUB_STEP_SUMMARY: summaryPath,
        E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
        E2E_STREAK_SCAN_LIMIT: "250",
      }),
    );

    await runSummary(
      reportFixturePath,
      makeEnv({
        GITHUB_STEP_SUMMARY: summaryPath,
        E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
        E2E_STREAK_SCAN_LIMIT: "250",
      }),
    );

    const output = fs.readFileSync(summaryPath, "utf8");
    const heatmapHeaderCount = (output.match(/^## E2E Heatmap$/gm) || []).length;

    assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
    assert.match(output, /Streak Scan Window: `3\/250` completed CI runs/);
    assert.equal(heatmapHeaderCount, 2);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runStdoutSummaryWriteCase() {
  const lines = [];
  const originalLog = console.log;
  console.log = (line) => {
    lines.push(String(line));
  };

  try {
    await runSummary(
      reportFixturePath,
      makeEnv({
        GITHUB_STEP_SUMMARY: "",
        E2E_SUMMARY_MOCK_HISTORY_FILE: historyFixturePath,
        E2E_STREAK_SCAN_LIMIT: "250",
      }),
    );
  } finally {
    console.log = originalLog;
  }

  const output = lines.join("\n");
  assert.match(output, /^## E2E Heatmap/m);
  assert.match(output, /Clean-Run Checkpoint: `2\/5` \(history-derived\)/);
  assert.match(output, /Streak Scan Window: `3\/250` completed CI runs/);
}

await runFallbackCase();
await runFallbackDirtyCase();
await runFallbackFlakyCase();
await runHistoryDerivedCase();
await runHistoryDerivedDirtyReportCase();
await runHistoryDerivedFlakyReportCase();
await runInterruptedResultCase();
await runHistoryDerivedFailingFirstCase();
await runScanLimitTruncationCase();
await runInvalidScanLimitFallbackCase();
await runNonPositiveScanLimitFallbackCase();
await runMixedTokenScanLimitFallbackCase();
await runTrimmedValidScanLimitCase();
await runOversizedScanLimitFallbackCase();
await runLeadingZeroScanLimitFallbackCase();
await runExcessiveSafeScanLimitCapCase();
await runHistoryDerivedNoE2EJobsCase();
await runMissingMockHistoryFileCase();
await runInvalidMockHistoryFileCase();
await runUnreadableMockHistoryFileCase();
await runMissingReportFileCase();
await runInvalidReportFileCase();
await runUnreadableReportFileCase();
await runStepSummaryWriteCase();
await runStdoutSummaryWriteCase();
console.log("e2e-summary self-test passed");
