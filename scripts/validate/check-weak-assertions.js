/**
 * CHECK: Weak Assertions
 *
 * Finds test assertions that don't verify actual values, which can hide bugs.
 *
 * Patterns detected:
 * - expect(x).toBeDefined() - should use toEqual/toBe with actual value
 * - expect(x).toBeTruthy() - often masks boolean checks
 * - expect(x).not.toBeNull() - should verify actual value
 * - {} as Type - forbidden type assertions in tests
 *
 * @strictness MEDIUM - Reports warnings. Encourages better assertions.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const WEAK_PATTERNS = [
  {
    name: "toBeDefined without value check",
    pattern: /expect\([^)]+\)\.toBeDefined\(\)/g,
    severity: "warn",
    suggestion: "Replace with toEqual(expectedValue) or toBe(expectedValue)",
  },
  {
    name: "toBeTruthy for result",
    pattern: /expect\(result\)\.toBeTruthy\(\)/g,
    severity: "warn",
    suggestion: "Replace with specific value assertion",
  },
  {
    name: "not.toBeNull without value check",
    pattern: /expect\([^)]+\)\.not\.toBeNull\(\)\s*;?\s*$/gm,
    severity: "info",
    suggestion: "Consider adding toEqual() assertion after null check",
  },
  {
    name: "{} as Type assertion (weak mock)",
    pattern: /\{\s*\}\s+as\s+[A-Z][a-zA-Z]+/g,
    severity: "warn",
    suggestion: "Use factory methods or build proper mock objects",
  },
];

export function run() {
  const TEST_DIRS = [path.join(ROOT, "convex"), path.join(ROOT, "src")];

  let errorCount = 0;
  let warnCount = 0;
  const messages = [];

  function auditFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const patternDef of WEAK_PATTERNS) {
      const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);

      for (let match = regex.exec(content); match !== null; match = regex.exec(content)) {
        const beforeMatch = content.slice(0, match.index);
        const lineNumber = beforeMatch.split("\n").length;
        const lineContent = lines[lineNumber - 1]?.trim() || "";
        const rel = relPath(filePath);

        if (patternDef.severity === "error") {
          messages.push(
            `  ${c.red}ERROR${c.reset} ${rel}:${lineNumber} - ${patternDef.name}: ${lineContent}`,
          );
          errorCount++;
        } else if (patternDef.severity === "warn") {
          messages.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNumber} - ${patternDef.name}: ${lineContent}`,
          );
          warnCount++;
        }
        // Skip 'info' severity - too noisy
      }
    }
  }

  for (const dir of TEST_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const testFiles = walkDir(dir, { extensions: new Set([".ts", ".tsx"]) });
    for (const file of testFiles) {
      // Only check test files
      if (!file.includes(".test.") && !file.includes(".spec.")) continue;
      auditFile(file);
    }
  }

  const detail = [];
  if (errorCount > 0) detail.push(`${errorCount} error(s)`);
  if (warnCount > 0) detail.push(`${warnCount} warning(s)`);

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: detail.length > 0 ? detail.join(", ") : undefined,
    messages: messages.length > 0 ? messages : undefined,
  };
}
