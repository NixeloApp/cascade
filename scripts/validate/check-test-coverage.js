/**
 * CHECK: Test Coverage
 *
 * Ensures critical files have corresponding test files.
 * Focuses on:
 * - Components in src/components/ (except ui/ primitives)
 * - Hooks in src/hooks/
 * - Convex functions in convex/ (queries, mutations, actions)
 *
 * Enforced. Missing tests are validation errors.
 */

import fs from "node:fs";
import path from "node:path";
import { TEST_COVERAGE_BASELINE } from "./test-coverage-baseline.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to check for test coverage
const COMPONENT_DIRS = ["src/components"];
const HOOK_DIR = "src/hooks";
const CONVEX_DIR = "convex";

// Skip patterns - files that don't need tests
const SKIP_PATTERNS = [
  /\.test\.tsx?$/, // Test files themselves
  /\.stories\.tsx?$/, // Storybook files
  /\.example\.tsx?$/, // Example/demo files
  /\/ui\//, // UI primitives (tested via integration)
  /\/index\.tsx?$/, // Re-export barrels
  /types\.ts$/, // Type definition files
  /\.d\.ts$/, // Declaration files
  /constants\.ts$/, // Constants files
  /_generated/, // Generated files
  /routeTree\.gen\.ts$/, // Generated route tree
  /schema\.ts$/, // Convex schema
  /convex\.config\.ts$/, // Convex config
  /http\.ts$/, // HTTP routes (tested via integration)
];

// Minimum lines for a file to require a test
const MIN_LINES_FOR_TEST = 30;

// Known exceptions - files that intentionally don't have tests
const ALLOWLIST = new Set([]);

function shouldRequireTest(filePath, content) {
  const rel = relPath(filePath);

  // Check skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(rel)) return false;
  }

  // Check allowlist
  if (ALLOWLIST.has(rel)) return false;

  // Check minimum lines
  const lines = content.split("\n").length;
  if (lines < MIN_LINES_FOR_TEST) return false;

  return true;
}

function findTestFile(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const ext = path.extname(filePath);
  const name = base.replace(ext, "");

  // Possible test file locations
  const testPatterns = [
    path.join(dir, `${name}.test${ext}`),
    path.join(dir, `${name}.test.ts`),
    path.join(dir, `${name}.test.tsx`),
    path.join(dir, "__tests__", `${name}.test${ext}`),
    path.join(dir, "__tests__", `${name}.test.ts`),
    path.join(dir, "__tests__", `${name}.test.tsx`),
  ];

  for (const testPath of testPatterns) {
    if (fs.existsSync(testPath)) return testPath;
  }

  return null;
}

export function run() {
  const issues = [];

  // Check components
  for (const componentDir of COMPONENT_DIRS) {
    const fullDir = path.join(ROOT, componentDir);
    if (!fs.existsSync(fullDir)) continue;

    for (const filePath of walkDir(fullDir)) {
      if (!filePath.endsWith(".tsx")) continue;

      const content = fs.readFileSync(filePath, "utf8");
      if (!shouldRequireTest(filePath, content)) continue;

      const testFile = findTestFile(filePath);
      if (!testFile) {
        issues.push({
          file: relPath(filePath),
          message: "Component missing test file",
        });
      }
    }
  }

  // Check hooks
  const hooksDir = path.join(ROOT, HOOK_DIR);
  if (fs.existsSync(hooksDir)) {
    for (const filePath of walkDir(hooksDir)) {
      if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) continue;

      const content = fs.readFileSync(filePath, "utf8");
      if (!shouldRequireTest(filePath, content)) continue;

      // Only check files that export hooks (use* functions)
      if (!/export\s+(?:function|const)\s+use[A-Z]/.test(content)) continue;

      const testFile = findTestFile(filePath);
      if (!testFile) {
        issues.push({
          file: relPath(filePath),
          message: "Hook missing test file",
        });
      }
    }
  }

  // Check Convex functions
  const convexDir = path.join(ROOT, CONVEX_DIR);
  if (fs.existsSync(convexDir)) {
    for (const filePath of walkDir(convexDir)) {
      if (!filePath.endsWith(".ts")) continue;

      const content = fs.readFileSync(filePath, "utf8");
      if (!shouldRequireTest(filePath, content)) continue;

      // Only check files that export queries/mutations/actions
      if (
        !/export\s+const\s+\w+\s*=\s*(?:query|mutation|action|internalQuery|internalMutation|internalAction)\(/.test(
          content,
        )
      )
        continue;

      const testFile = findTestFile(filePath);
      if (!testFile) {
        issues.push({
          file: relPath(filePath),
          message: "Convex function missing test file",
        });
      }
    }
  }

  const currentIssueFiles = new Set(issues.map((issue) => issue.file));
  const baselineEntries = new Set(TEST_COVERAGE_BASELINE);
  const regressions = issues.filter((issue) => !baselineEntries.has(issue.file));
  const staleBaselineEntries = TEST_COVERAGE_BASELINE.filter(
    (file) => !currentIssueFiles.has(file),
  );

  const regressionMessages = regressions.map(
    (issue) =>
      `  ${c.red}ERROR${c.reset} ${issue.file} - ${issue.message} (new uncovered file outside baseline)`,
  );
  const staleBaselineMessages = staleBaselineEntries.map(
    (file) =>
      `  ${c.red}ERROR${c.reset} ${file} - Remove this file from test-coverage-baseline.js; it no longer needs a baseline entry`,
  );
  const errors = [...regressionMessages, ...staleBaselineMessages];
  const errorCount = regressions.length + staleBaselineEntries.length;
  const detailParts = [];
  if (regressions.length > 0) {
    detailParts.push(`${regressions.length} uncovered file(s) outside baseline`);
  }
  if (staleBaselineEntries.length > 0) {
    detailParts.push(
      `${staleBaselineEntries.length} stale baseline entr${staleBaselineEntries.length === 1 ? "y" : "ies"}`,
    );
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? detailParts.join(", ") : null,
    messages: errorCount > 0 ? errors : [],
  };
}
