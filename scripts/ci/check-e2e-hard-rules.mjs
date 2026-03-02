#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const E2E_DIR = path.join(ROOT, "e2e");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "e2e-hard-rules-baseline.json");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!TARGET_EXTENSIONS.has(ext)) {
      continue;
    }

    const isSpec = entry.name.endsWith(".spec.ts") || entry.name.endsWith(".spec.tsx");
    if (isSpec) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(E2E_DIR)) {
    console.error("E2E directory not found:", E2E_DIR);
    process.exit(1);
  }

  const specFiles = collectFiles(E2E_DIR);
  const timeoutViolations = [];
  const networkIdleViolations = [];
  const selectorAntiPatterns = [];

  for (const filePath of specFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (line.includes("waitForTimeout(")) {
        timeoutViolations.push({
          file: path.relative(ROOT, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      if (
        line.includes('waitForLoadState("networkidle"') ||
        line.includes("waitForLoadState('networkidle'")
      ) {
        networkIdleViolations.push({
          file: path.relative(ROOT, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      const trimmed = line.trim();
      const file = path.relative(ROOT, filePath);
      const lineNumber = index + 1;
      const hasTextEngineLocator =
        trimmed.includes('locator("text=') ||
        trimmed.includes("locator('text=") ||
        trimmed.includes("locator(`text=");
      if (hasTextEngineLocator) {
        selectorAntiPatterns.push({
          file,
          line: lineNumber,
          type: "locator-text-engine",
          text: trimmed,
        });
      }

      const hasNthSelector = trimmed.includes(":nth-child(") || trimmed.includes(":nth-of-type(");
      if (hasNthSelector) {
        selectorAntiPatterns.push({
          file,
          line: lineNumber,
          type: "locator-nth-selector",
          text: trimmed,
        });
      }
    });
  }

  if (timeoutViolations.length > 0) {
    console.error("E2E hard rule violation: waitForTimeout(...) found in spec files.");
    for (const violation of timeoutViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (networkIdleViolations.length > 0) {
    console.error('E2E hard rule violation: waitForLoadState("networkidle") found in spec files.');
    for (const violation of networkIdleViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  const known = new Set(
    (baseline.selectorAntiPatterns ?? []).map(
      (entry) => `${entry.file}:${entry.line}:${entry.type}`,
    ),
  );
  const newlyIntroduced = selectorAntiPatterns.filter(
    (entry) => !known.has(`${entry.file}:${entry.line}:${entry.type}`),
  );

  if (newlyIntroduced.length > 0) {
    console.error("E2E selector anti-pattern regression: new brittle selector usage detected.");
    for (const violation of newlyIntroduced) {
      console.error(
        `- [${violation.type}] ${violation.file}:${violation.line} -> ${violation.text}`,
      );
    }
    console.error(
      "Existing baseline entries are allowed temporarily; add fixes instead of expanding baseline when possible.",
    );
    process.exit(1);
  }

  console.log(`E2E hard-rule check passed: scanned ${specFiles.length} spec files.`);
  console.log(`- waitForTimeout violations: ${timeoutViolations.length}`);
  console.log(`- networkidle wait violations: ${networkIdleViolations.length}`);
  console.log(`- selector anti-patterns (baseline-allowed): ${selectorAntiPatterns.length}`);
  console.log(`- new selector anti-patterns: ${newlyIntroduced.length}`);
}

main();
