#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSummaryLines } from "./e2e-summary.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportFixturePath = path.join(__dirname, "fixtures", "e2e-summary-report-mock.json");
const historyFixturePath = path.join(__dirname, "fixtures", "e2e-summary-history-mock.json");
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
}

await runFallbackCase();
await runHistoryDerivedCase();
console.log("e2e-summary self-test passed");
