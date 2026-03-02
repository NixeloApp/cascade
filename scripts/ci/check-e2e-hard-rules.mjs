#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const E2E_DIR = path.join(ROOT, "e2e");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "e2e-hard-rules-baseline.json");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);
const PROMISE_SLEEP_PATTERN =
  /new\s+Promise\s*\(\s*(?:\(\s*[_$a-zA-Z][\w$]*\s*\)|[_$a-zA-Z][\w$]*|\(\s*\))\s*=>\s*setTimeout\s*\(/gms;

function lineFromIndex(source, index) {
  return source.slice(0, index).split("\n").length;
}

export function collectFiles(dir, files = []) {
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

export function analyzeE2EHardRules({
  root = ROOT,
  e2eDir = E2E_DIR,
  baselinePath = BASELINE_PATH,
} = {}) {
  if (!fs.existsSync(e2eDir)) {
    throw new Error(`E2E directory not found: ${e2eDir}`);
  }

  const specFiles = collectFiles(e2eDir);
  const timeoutViolations = [];
  const promiseSleepViolations = [];
  const networkIdleViolations = [];
  const querySelectorViolations = [];
  const forcedActionViolations = [];
  const xpathSelectorViolations = [];
  const selectorAntiPatterns = [];

  for (const filePath of specFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (line.includes("waitForTimeout(")) {
        timeoutViolations.push({
          file: path.relative(root, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      if (
        line.includes('waitForLoadState("networkidle"') ||
        line.includes("waitForLoadState('networkidle'")
      ) {
        networkIdleViolations.push({
          file: path.relative(root, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      if (/\.\$\$?\(/.test(line)) {
        querySelectorViolations.push({
          file: path.relative(root, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      if (/force\s*:\s*true/.test(line)) {
        forcedActionViolations.push({
          file: path.relative(root, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      if (/locator\(\s*["'`](?:xpath=|\/\/)/.test(line)) {
        xpathSelectorViolations.push({
          file: path.relative(root, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }

      const trimmed = line.trim();
      const file = path.relative(root, filePath);
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

    for (const match of source.matchAll(PROMISE_SLEEP_PATTERN)) {
      const matchIndex = match.index ?? 0;
      promiseSleepViolations.push({
        file: path.relative(root, filePath),
        line: lineFromIndex(source, matchIndex),
        text: match[0].replace(/\s+/g, " ").trim(),
      });
    }
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const known = new Set(
    (baseline.selectorAntiPatterns ?? []).map(
      (entry) => `${entry.file}:${entry.line}:${entry.type}`,
    ),
  );
  const newlyIntroduced = selectorAntiPatterns.filter(
    (entry) => !known.has(`${entry.file}:${entry.line}:${entry.type}`),
  );

  return {
    specFileCount: specFiles.length,
    timeoutViolations,
    promiseSleepViolations,
    networkIdleViolations,
    querySelectorViolations,
    forcedActionViolations,
    xpathSelectorViolations,
    selectorAntiPatterns,
    newlyIntroduced,
  };
}

function main() {
  let result;
  try {
    result = analyzeE2EHardRules();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (result.timeoutViolations.length > 0) {
    console.error("E2E hard rule violation: waitForTimeout(...) found in spec files.");
    for (const violation of result.timeoutViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.promiseSleepViolations.length > 0) {
    console.error("E2E hard rule violation: Promise-wrapped setTimeout sleep found in spec files.");
    for (const violation of result.promiseSleepViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.networkIdleViolations.length > 0) {
    console.error('E2E hard rule violation: waitForLoadState("networkidle") found in spec files.');
    for (const violation of result.networkIdleViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.querySelectorViolations.length > 0) {
    console.error("E2E hard rule violation: page.$ / page.$$ selector API found in spec files.");
    for (const violation of result.querySelectorViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.forcedActionViolations.length > 0) {
    console.error("E2E hard rule violation: force:true action override found in spec files.");
    for (const violation of result.forcedActionViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.xpathSelectorViolations.length > 0) {
    console.error("E2E hard rule violation: XPath locator usage found in spec files.");
    for (const violation of result.xpathSelectorViolations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  if (result.newlyIntroduced.length > 0) {
    console.error("E2E selector anti-pattern regression: new brittle selector usage detected.");
    for (const violation of result.newlyIntroduced) {
      console.error(
        `- [${violation.type}] ${violation.file}:${violation.line} -> ${violation.text}`,
      );
    }
    console.error(
      "Existing baseline entries are allowed temporarily; add fixes instead of expanding baseline when possible.",
    );
    process.exit(1);
  }

  console.log(`E2E hard-rule check passed: scanned ${result.specFileCount} spec files.`);
  console.log(`- waitForTimeout violations: ${result.timeoutViolations.length}`);
  console.log(`- Promise setTimeout sleep violations: ${result.promiseSleepViolations.length}`);
  console.log(`- networkidle wait violations: ${result.networkIdleViolations.length}`);
  console.log(`- page.$ / page.$$ selector violations: ${result.querySelectorViolations.length}`);
  console.log(`- force:true action violations: ${result.forcedActionViolations.length}`);
  console.log(`- XPath locator violations: ${result.xpathSelectorViolations.length}`);
  console.log(`- selector anti-patterns (baseline-allowed): ${result.selectorAntiPatterns.length}`);
  console.log(`- new selector anti-patterns: ${result.newlyIntroduced.length}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main();
}
