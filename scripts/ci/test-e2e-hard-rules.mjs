#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { analyzeE2EHardRules } from "./check-e2e-hard-rules.mjs";

function withTempRoot(run) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-hard-rules-"));
  try {
    return run(tmpRoot);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

function writeFile(root, relativePath, content) {
  const targetPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

function writeBaseline(root, selectorAntiPatterns = []) {
  const baselinePath = path.join(root, "scripts", "ci", "e2e-hard-rules-baseline.json");
  writeFile(
    root,
    "scripts/ci/e2e-hard-rules-baseline.json",
    JSON.stringify({ selectorAntiPatterns }),
  );
  return baselinePath;
}

function runCleanCase() {
  withTempRoot((root) => {
    writeFile(
      root,
      "e2e/clean.spec.ts",
      "import { test } from '@playwright/test';\ntest('clean', async ({ page }) => { await page.goto('/'); });\n",
    );
    const baselinePath = writeBaseline(root);

    const result = analyzeE2EHardRules({
      root,
      e2eDir: path.join(root, "e2e"),
      baselinePath,
    });

    assert.equal(result.specFileCount, 1);
    assert.equal(result.timeoutViolations.length, 0);
    assert.equal(result.promiseSleepViolations.length, 0);
    assert.equal(result.networkIdleViolations.length, 0);
    assert.equal(result.querySelectorViolations.length, 0);
    assert.equal(result.forcedActionViolations.length, 0);
    assert.equal(result.xpathSelectorViolations.length, 0);
    assert.equal(result.selectorAntiPatterns.length, 0);
    assert.equal(result.newlyIntroduced.length, 0);
  });
}

function runBaselineAllowedSelectorCase() {
  withTempRoot((root) => {
    writeFile(
      root,
      "e2e/baseline.spec.ts",
      [
        "import { test } from '@playwright/test';",
        "test('baseline', async ({ page }) => {",
        '  const el = page.locator("text=Legacy");',
        "  await page.locator('div:nth-child(2)').click();",
        "  await el.click();",
        "});",
        "",
      ].join("\n"),
    );

    const baselinePath = writeBaseline(root, [
      { file: "e2e/baseline.spec.ts", line: 3, type: "locator-text-engine" },
      { file: "e2e/baseline.spec.ts", line: 4, type: "locator-nth-selector" },
    ]);

    const result = analyzeE2EHardRules({
      root,
      e2eDir: path.join(root, "e2e"),
      baselinePath,
    });

    assert.equal(result.timeoutViolations.length, 0);
    assert.equal(result.promiseSleepViolations.length, 0);
    assert.equal(result.networkIdleViolations.length, 0);
    assert.equal(result.querySelectorViolations.length, 0);
    assert.equal(result.forcedActionViolations.length, 0);
    assert.equal(result.xpathSelectorViolations.length, 0);
    assert.equal(result.selectorAntiPatterns.length, 2);
    assert.equal(result.newlyIntroduced.length, 0);
  });
}

function runViolationCase() {
  withTempRoot((root) => {
    writeFile(
      root,
      "e2e/violations.spec.ts",
      [
        "import { test } from '@playwright/test';",
        "test('violations', async ({ page }) => {",
        "  await page.waitForTimeout(1000);",
        "  await new Promise((resolve) => setTimeout(resolve, 250));",
        "  await page.waitForLoadState('networkidle');",
        "  const el = await page.$('[data-testid=\"foo\"]');",
        "  await el?.click();",
        "  await page.getByRole('button', { name: 'Save' }).click({ force: true });",
        "  await page.locator(\"xpath=//button[text()='Legacy']\").click();",
        '  await page.locator("text=New").click();',
        "});",
        "",
      ].join("\n"),
    );

    const baselinePath = writeBaseline(root, []);

    const result = analyzeE2EHardRules({
      root,
      e2eDir: path.join(root, "e2e"),
      baselinePath,
    });

    assert.equal(result.timeoutViolations.length, 1);
    assert.equal(result.promiseSleepViolations.length, 1);
    assert.equal(result.networkIdleViolations.length, 1);
    assert.equal(result.querySelectorViolations.length, 1);
    assert.equal(result.forcedActionViolations.length, 1);
    assert.equal(result.xpathSelectorViolations.length, 1);
    assert.equal(result.selectorAntiPatterns.length, 1);
    assert.equal(result.newlyIntroduced.length, 1);
    assert.equal(result.newlyIntroduced[0]?.type, "locator-text-engine");
  });
}

runCleanCase();
runBaselineAllowedSelectorCase();
runViolationCase();
console.log("e2e-hard-rules self-test passed");
