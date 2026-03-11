/**
 * CHECK: Weak Assertions
 *
 * Flags weak test assertions that don't provide meaningful validation:
 * - toBeDefined() - Only checks !== undefined, doesn't validate value
 * - toBeTruthy() - Passes for any truthy value, too permissive
 * - toBeFalsy() - Passes for any falsy value, too permissive
 * - {} as Type - Unsafe type casts that bypass type checking
 * - expect(x) without assertion - Incomplete assertions
 *
 * Enforced. Weak assertions fail validation.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to check
const TEST_DIRS = ["src", "convex", "e2e"];

// Weak assertion patterns
const WEAK_PATTERNS = [
  {
    pattern: /\.toBeDefined\(\)/g,
    message: "toBeDefined() is weak - use specific value assertions instead",
    suggestion: "Use toEqual(), toBe(), or check specific properties",
  },
  {
    pattern: /\.toBeTruthy\(\)/g,
    message: "toBeTruthy() is too permissive - use specific assertions",
    suggestion: "Use toBe(true), toEqual(expected), or check specific values",
  },
  {
    pattern: /\.toBeFalsy\(\)/g,
    message: "toBeFalsy() is too permissive - use specific assertions",
    suggestion: "Use toBe(false), toBeNull(), toBeUndefined(), or toBe('')",
  },
  {
    pattern: /\{\s*\}\s+as\s+\w+/g,
    message: "Empty object cast {} as Type bypasses type safety",
    suggestion: "Create a proper mock object with required properties",
  },
  {
    pattern: /expect\([^)]+\)\s*[;\n](?!\s*\.)/g,
    message: "expect() without assertion does nothing",
    suggestion: "Add an assertion like .toBe(), .toEqual(), .toHaveBeenCalled()",
  },
];

// Skip certain files
const SKIP_PATTERNS = [/node_modules/, /\.d\.ts$/];

// Known allowlist - sometimes these are genuinely needed
const ALLOWLIST_LINES = new Set([
  // Add specific file:line patterns if needed
]);

function checkFile(filePath) {
  const issues = [];
  const rel = relPath(filePath);

  // Only check test files
  if (!rel.includes(".test.")) return issues;

  // Skip excluded paths
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(rel)) return issues;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    for (const { pattern, message, suggestion } of WEAK_PATTERNS) {
      pattern.lastIndex = 0;

      if (pattern.test(line)) {
        const key = `${rel}:${lineNum}`;
        if (!ALLOWLIST_LINES.has(key)) {
          issues.push({
            file: rel,
            line: lineNum,
            message,
            suggestion,
            code: line.trim().substring(0, 80),
          });
        }
      }
    }
  }

  return issues;
}

export function run() {
  const allIssues = [];

  for (const dir of TEST_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    for (const filePath of walkDir(fullDir)) {
      if (!filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx")) continue;

      const issues = checkFile(filePath);
      allIssues.push(...issues);
    }
  }

  const messages = allIssues.map(
    (issue) =>
      `  ${c.red}ERROR${c.reset} ${issue.file}:${issue.line} - ${issue.message}\n` +
      `         ${c.dim}${issue.code}${c.reset}\n` +
      `         ${c.yellow}Suggestion:${c.reset} ${issue.suggestion}`,
  );

  if (allIssues.length > 0) {
    console.log(`${c.red}Found ${allIssues.length} weak assertion(s):${c.reset}`);
  }

  return {
    passed: allIssues.length === 0,
    errors: allIssues.length,
    detail: allIssues.length > 0 ? `${allIssues.length} weak assertion(s)` : null,
    messages,
  };
}
