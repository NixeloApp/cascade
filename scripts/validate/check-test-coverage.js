/**
 * CHECK: Test Coverage
 *
 * Identifies critical files that should have tests but don't:
 * - convex/*.ts (backend logic)
 * - src/hooks/*.ts (reusable hooks)
 * - src/lib/*.ts (utilities)
 *
 * A file is considered "covered" if it has a corresponding .test.ts file
 * in the same directory or a __tests__ subdirectory.
 *
 * @strictness INFO - Reports only, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "warn",
};

// Directories to check for test coverage
const CRITICAL_DIRS = [
  { path: "convex", label: "Backend (Convex)" },
  { path: "src/hooks", label: "Hooks" },
  { path: "src/lib", label: "Utilities" },
];

// Files/patterns to skip (don't require tests)
const SKIP_PATTERNS = [
  ".test.",
  ".spec.",
  ".d.ts",
  "index.ts", // Re-exports
  "_generated",
  "schema.ts", // Convex schema
  "auth.config.ts",
  "http.ts", // Convex HTTP router
  "crons.ts", // Convex crons
  "validators.ts",
  "types.ts", // Type definitions
  "constants.ts", // Constants don't need tests
  "test-utils.ts",
  "test-helpers.ts",
  ".stories.",
];

// Files that are allowed to not have tests (with justification)
const ALLOWED_NO_TESTS = new Set([
  // Convex internal/generated
  "convex/convex.config.ts",
  // Simple re-exports or thin wrappers
  "src/lib/utils.ts", // cn() utility, trivial
  "src/lib/toast.ts", // Thin wrapper over sonner
  // Configuration files
  "src/lib/serviceWorker.ts", // Browser API dependent
]);

export function run() {
  if (CONFIG.strictness === "off") {
    return {
      passed: true,
      errors: 0,
      detail: "Disabled",
      messages: [],
    };
  }

  let warningCount = 0;
  const warnings = [];
  const stats = { checked: 0, covered: 0, missing: 0 };

  function reportWarning(filePath, message) {
    const rel = relPath(filePath);
    const prefix = CONFIG.strictness === "error" ? c.red + "ERROR" : c.yellow + "WARN";
    warnings.push(`  ${prefix}${c.reset} ${rel} - ${message}`);
    warningCount++;
  }

  /**
   * Check if a test file exists for the given source file
   */
  function hasTestFile(filePath) {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);

    // Check for test file in same directory
    const testPatterns = [
      path.join(dir, `${baseName}.test${ext}`),
      path.join(dir, `${baseName}.spec${ext}`),
      path.join(dir, `${baseName}.test.tsx`),
      path.join(dir, `${baseName}.spec.tsx`),
      // Check __tests__ subdirectory
      path.join(dir, "__tests__", `${baseName}.test${ext}`),
      path.join(dir, "__tests__", `${baseName}.spec${ext}`),
    ];

    return testPatterns.some((testPath) => fs.existsSync(testPath));
  }

  /**
   * Get all TypeScript files in a directory (non-recursive for hooks/lib)
   */
  function getFilesInDir(dirPath, recursive = false) {
    const files = [];

    if (!fs.existsSync(dirPath)) return files;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        files.push(...getFilesInDir(fullPath, recursive));
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // Check each critical directory
  for (const { path: dirRelPath, label } of CRITICAL_DIRS) {
    const dirPath = path.join(ROOT, dirRelPath);

    if (!fs.existsSync(dirPath)) continue;

    // Convex needs recursive, hooks/lib are flat
    const recursive = dirRelPath === "convex";
    const files = getFilesInDir(dirPath, recursive);

    for (const filePath of files) {
      const rel = relPath(filePath);

      // Skip files that don't need tests
      if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) continue;

      // Skip explicitly allowed files
      if (ALLOWED_NO_TESTS.has(rel)) continue;

      stats.checked++;

      if (hasTestFile(filePath)) {
        stats.covered++;
      } else {
        stats.missing++;
        reportWarning(filePath, `Missing test file (${label})`);
      }
    }
  }

  const coveragePercent =
    stats.checked > 0 ? Math.round((stats.covered / stats.checked) * 100) : 100;

  return {
    passed: CONFIG.strictness === "warn" ? true : warningCount === 0,
    errors: CONFIG.strictness === "error" ? warningCount : 0,
    warnings: CONFIG.strictness === "warn" ? warningCount : 0,
    detail: `${stats.missing} missing tests (${coveragePercent}% covered)`,
    messages: warnings.slice(0, 20), // Limit output to first 20
  };
}
