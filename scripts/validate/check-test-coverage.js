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
  /convex\/e2e\.ts$/, // E2E test helpers (testing tests is circular)
  /convex\/examples\//, // Example/demo code
  /convex\/auditLogs\.ts$/, // Skips in test env by design
  /convex\/ai\//, // Requires external AI services
  /convex\/email\//, // Requires external email service
  /convex\/slackCommandsCore\.ts$/, // Requires external Slack service
  /shadcn-calendar\//, // Internal calendar subcomponents (tested via CalendarView integration)
  /Plate\/.*Element\.tsx$/, // Plate element renderers (tested via editor integration)
  /convex\/invoicesActions\.ts$/, // Node.js action, needs special runtime
  /convex\/authWrapper\.ts$/, // Has 4 related test files (name mismatch with validator)
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

  const errors = issues.map(
    (issue) => `  ${c.red}ERROR${c.reset} ${issue.file} - ${issue.message}`,
  );
  const errorCount = issues.length;
  const detailParts = [];
  if (issues.length > 0) {
    detailParts.push(`${issues.length} uncovered file(s)`);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? detailParts.join(", ") : null,
    messages: errorCount > 0 ? errors : [],
  };
}
