/**
 * CHECK: Import Path Consistency
 *
 * Validates that imports follow project conventions:
 * - Deep relative imports (../../../) should use @/ alias
 * - No imports from deprecated/deleted modules
 * - No direct imports from convex/ in frontend code (use @convex/)
 *
 * @strictness INFO - Reports issues, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "info",
};

// Directories to check
const CHECK_DIRS = ["src/components", "src/hooks", "src/lib", "src/routes"];

// Files/directories to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  /_generated/,
  /\.d\.ts$/,
];

// Deprecated/deleted import paths (should not be used)
const DEPRECATED_IMPORTS = [
  {
    pattern: /@\/components\/ui\/PageHeader/,
    message: "ui/PageHeader was deleted - use layout/PageHeader instead",
  },
];

// Patterns that indicate deep relative imports that should use @/
const DEEP_RELATIVE_THRESHOLD = 3; // ../../../ or deeper

/**
 * Check if a file should be skipped
 */
function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Extract import statements from file content
 */
function extractImports(content) {
  const imports = [];

  // Match: import ... from "..."
  const importMatches = content.matchAll(/import\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g);
  for (const match of importMatches) {
    imports.push({
      path: match[1],
      fullMatch: match[0],
      index: match.index,
    });
  }

  // Match: import "..." (side-effect imports)
  const sideEffectMatches = content.matchAll(/import\s+["']([^"']+)["']/g);
  for (const match of sideEffectMatches) {
    // Skip if already captured
    if (!imports.some((i) => i.path === match[1])) {
      imports.push({
        path: match[1],
        fullMatch: match[0],
        index: match.index,
      });
    }
  }

  return imports;
}

/**
 * Count relative depth (number of ../ segments)
 */
function countRelativeDepth(importPath) {
  const matches = importPath.match(/\.\.\//g);
  return matches ? matches.length : 0;
}

/**
 * Get line number from character index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split("\n").length;
}

/**
 * Check imports in a single file
 */
function checkFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const imports = extractImports(content);

    for (const imp of imports) {
      const lineNum = getLineNumber(content, imp.index);

      // Check for deprecated imports
      for (const deprecated of DEPRECATED_IMPORTS) {
        if (deprecated.pattern.test(imp.path)) {
          issues.push({
            type: "deprecated",
            line: lineNum,
            import: imp.path,
            message: deprecated.message,
          });
        }
      }

      // Check for deep relative imports
      const depth = countRelativeDepth(imp.path);
      if (depth >= DEEP_RELATIVE_THRESHOLD) {
        issues.push({
          type: "deep-relative",
          line: lineNum,
          import: imp.path,
          message: `Deep relative import (${depth} levels) - consider using @/ alias`,
        });
      }

      // Check for direct convex/ imports to local files (should use @convex/)
      // Note: "convex/react", "convex/server", "convex/browser", "convex/values" are npm package imports (valid)
      const convexNpmPackages = [
        "convex/react",
        "convex/server",
        "convex/browser",
        "convex/values",
      ];
      const isConvexPackageImport = convexNpmPackages.some(
        (pkg) => imp.path === pkg || imp.path.startsWith(`${pkg}/`),
      );
      if (
        imp.path.startsWith("convex/") &&
        !imp.path.startsWith("convex-test") &&
        !isConvexPackageImport
      ) {
        issues.push({
          type: "convex-direct",
          line: lineNum,
          import: imp.path,
          message: "Use @convex/ alias instead of direct convex/ import",
        });
      }
    }
  } catch {
    // Skip unreadable files
  }

  return issues;
}

/**
 * Main validation function
 */
export function run() {
  if (CONFIG.strictness === "off") {
    return { passed: true, errors: 0, warnings: 0, detail: "Disabled", messages: [] };
  }

  const allIssues = [];

  for (const dir of CHECK_DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = walkDir(dirPath).filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !shouldSkip(f),
    );

    for (const file of files) {
      const issues = checkFile(file);
      for (const issue of issues) {
        allIssues.push({
          file: relPath(file),
          ...issue,
        });
      }
    }
  }

  // Group issues by type
  const deprecatedCount = allIssues.filter((i) => i.type === "deprecated").length;
  const deepRelativeCount = allIssues.filter((i) => i.type === "deep-relative").length;
  const convexDirectCount = allIssues.filter((i) => i.type === "convex-direct").length;

  const isError = CONFIG.strictness === "error" && allIssues.length > 0;
  const totalIssues = allIssues.length;

  // Format messages
  const messages = allIssues.map(
    (i) => `  ${c.yellow}INFO${c.reset} ${i.file}:${i.line} - ${i.message}`,
  );

  return {
    passed: true, // INFO level always passes
    errors: isError ? totalIssues : 0,
    warnings: isError ? 0 : totalIssues,
    detail:
      totalIssues > 0
        ? `${totalIssues} import issue(s) (${deprecatedCount} deprecated, ${deepRelativeCount} deep-relative, ${convexDirectCount} convex-direct)`
        : undefined,
    messages,
  };
}

// Run standalone
if (process.argv[1] === import.meta.url.replace("file://", "")) {
  const result = run();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
