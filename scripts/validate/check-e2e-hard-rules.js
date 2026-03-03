/**
 * CHECK: E2E Hard Rules
 *
 * Enforces strict E2E test quality rules that block CI if violated:
 * - waitForTimeout(...) - hardcoded sleeps
 * - Promise-wrapped setTimeout sleeps
 * - waitForLoadState("networkidle") - flaky
 * - page.$() / page.$$() - deprecated selectors
 * - force: true - skips actionability checks
 * - XPath selectors - brittle
 * - Selector anti-patterns (text=, nth-child, etc.)
 *
 * @strictness HIGH - Any violation fails the check.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath } from "./utils.js";

const E2E_DIR = path.join(ROOT, "e2e");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "e2e-hard-rules-baseline.json");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);
const PROMISE_SLEEP_PATTERN =
  /new\s+Promise\s*\(\s*(?:\(\s*[_$a-zA-Z][\w$]*\s*\)|[_$a-zA-Z][\w$]*|\(\s*\))\s*=>\s*setTimeout\s*\(/gms;

function lineFromIndex(source, index) {
  return source.slice(0, index).split("\n").length;
}

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!TARGET_EXTENSIONS.has(ext)) continue;
    if (entry.name.endsWith(".spec.ts") || entry.name.endsWith(".spec.tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

export function run() {
  if (!fs.existsSync(E2E_DIR)) {
    return { passed: true, errors: 0, detail: "No e2e/ directory" };
  }

  const messages = [];
  const specFiles = collectFiles(E2E_DIR);

  const violations = {
    timeout: [],
    promiseSleep: [],
    networkIdle: [],
    querySelector: [],
    forcedAction: [],
    xpath: [],
    selectorAntiPattern: [],
  };

  for (const filePath of specFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const lines = source.split("\n");
    const file = relPath(filePath);

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      if (line.includes("waitForTimeout(")) {
        violations.timeout.push({ file, line: lineNum, text: trimmed });
      }

      if (
        line.includes('waitForLoadState("networkidle"') ||
        line.includes("waitForLoadState('networkidle'")
      ) {
        violations.networkIdle.push({ file, line: lineNum, text: trimmed });
      }

      if (/\.\$\$?\(/.test(line)) {
        violations.querySelector.push({ file, line: lineNum, text: trimmed });
      }

      if (/force\s*:\s*true/.test(line)) {
        violations.forcedAction.push({ file, line: lineNum, text: trimmed });
      }

      if (/locator\(\s*["'`](?:xpath=|\/\/)/.test(line)) {
        violations.xpath.push({ file, line: lineNum, text: trimmed });
      }

      if (
        trimmed.includes('locator("text=') ||
        trimmed.includes("locator('text=") ||
        trimmed.includes("locator(`text=")
      ) {
        violations.selectorAntiPattern.push({
          file,
          line: lineNum,
          type: "locator-text-engine",
          text: trimmed,
        });
      }

      if (trimmed.includes(":nth-child(") || trimmed.includes(":nth-of-type(")) {
        violations.selectorAntiPattern.push({
          file,
          line: lineNum,
          type: "locator-nth-selector",
          text: trimmed,
        });
      }
    });

    for (const match of source.matchAll(PROMISE_SLEEP_PATTERN)) {
      violations.promiseSleep.push({
        file,
        line: lineFromIndex(source, match.index ?? 0),
        text: match[0].replace(/\s+/g, " ").trim(),
      });
    }
  }

  // Check baseline for selector anti-patterns
  let baseline = { selectorAntiPatterns: [] };
  if (fs.existsSync(BASELINE_PATH)) {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  }
  const known = new Set(
    (baseline.selectorAntiPatterns ?? []).map((e) => `${e.file}:${e.line}:${e.type}`),
  );
  const newAntiPatterns = violations.selectorAntiPattern.filter(
    (e) => !known.has(`${e.file}:${e.line}:${e.type}`),
  );

  // Report violations
  const reportViolation = (category, v) => {
    messages.push(`  ${c.red}ERROR${c.reset} [${category}] ${v.file}:${v.line} - ${v.text}`);
  };

  violations.timeout.forEach((v) => reportViolation("waitForTimeout", v));
  violations.promiseSleep.forEach((v) => reportViolation("Promise sleep", v));
  violations.networkIdle.forEach((v) => reportViolation("networkidle", v));
  violations.querySelector.forEach((v) => reportViolation("page.$/$$", v));
  violations.forcedAction.forEach((v) => reportViolation("force:true", v));
  violations.xpath.forEach((v) => reportViolation("XPath", v));
  newAntiPatterns.forEach((v) => reportViolation(`selector:${v.type}`, v));

  const errorCount =
    violations.timeout.length +
    violations.promiseSleep.length +
    violations.networkIdle.length +
    violations.querySelector.length +
    violations.forcedAction.length +
    violations.xpath.length +
    newAntiPatterns.length;

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : `${specFiles.length} specs checked`,
    messages: messages.length > 0 ? messages : undefined,
  };
}
