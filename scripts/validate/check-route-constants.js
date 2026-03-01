/**
 * CHECK: Route Constants Usage
 *
 * Validates that route URLs use ROUTES constants instead of hardcoded strings.
 *
 * Patterns flagged:
 * - Template literals with route paths: `/${orgSlug}/dashboard`
 * - String literals with route paths: "/signin", "/dashboard"
 * - navigate(), Link to=, href= with hardcoded paths
 *
 * Allowed:
 * - ROUTES.*.build() calls
 * - ROUTES.*.path references
 * - External URLs (https://, http://)
 * - API routes (/api/*)
 * - Anchor links (#*)
 *
 * @strictness MEDIUM - Reports warnings, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "warn",
};

// Known route patterns that should use ROUTES constants
const ROUTE_PATTERNS = [
  // Auth routes
  /["'`]\/signin["'`]/,
  /["'`]\/signup["'`]/,
  /["'`]\/forgot-password["'`]/,
  /["'`]\/onboarding["'`]/,
  /["'`]\/verify-2fa["'`]/,
  /["'`]\/terms["'`]/,
  /["'`]\/privacy["'`]/,

  // Dynamic org routes - template literals
  /`\/\$\{[^}]+\}\/dashboard`/,
  /`\/\$\{[^}]+\}\/inbox`/,
  /`\/\$\{[^}]+\}\/analytics`/,
  /`\/\$\{[^}]+\}\/team`/,
  /`\/\$\{[^}]+\}\/documents`/,
  /`\/\$\{[^}]+\}\/projects`/,
  /`\/\$\{[^}]+\}\/issues`/,
  /`\/\$\{[^}]+\}\/workspaces`/,
  /`\/\$\{[^}]+\}\/settings`/,
  /`\/\$\{[^}]+\}\/notifications`/,
  /`\/\$\{[^}]+\}\/time-tracking`/,
  /`\/\$\{[^}]+\}\/assistant`/,
  /`\/\$\{[^}]+\}\/mcp-server`/,
  /`\/\$\{[^}]+\}\/add-ons`/,
  /`\/\$\{[^}]+\}\/authentication`/,
];

// Files/directories to skip
const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".next",
  "_generated",
  "routeTree.gen.ts",
  "routes.ts", // The routes definition itself
  ".test.",
  ".spec.",
  "e2e/",
];

// Allowed patterns (not flagged)
const ALLOWED_PATTERNS = [
  /ROUTES\./, // Using ROUTES constant
  /["'`]https?:\/\//, // External URLs
  /["'`]\/api\//, // API routes
  /["'`]#/, // Anchor links
  /["'`]mailto:/, // Email links
  /["'`]tel:/, // Phone links
  /path:\s*["'`]/, // Route path definitions
  /createFileRoute/, // TanStack Router route definitions
];

export function run() {
  if (CONFIG.strictness === "off") {
    return {
      passed: true,
      errors: 0,
      detail: "Disabled",
      messages: [],
    };
  }

  const SRC_DIR = path.join(ROOT, "src");

  let warningCount = 0;
  const warnings = [];

  function reportWarning(filePath, line, _match, message) {
    const rel = relPath(filePath);
    const prefix = CONFIG.strictness === "error" ? `${c.red}ERROR` : `${c.yellow}WARN`;
    warnings.push(`  ${prefix}${c.reset} ${rel}:${line} - ${message}`);
    warningCount++;
  }

  /**
   * Check a file for hardcoded routes
   */
  function checkFile(filePath) {
    const rel = relPath(filePath);

    // Skip certain files
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip if line has allowed patterns
      if (ALLOWED_PATTERNS.some((pattern) => pattern.test(line))) continue;

      // Check for hardcoded route patterns
      for (const pattern of ROUTE_PATTERNS) {
        if (pattern.test(line)) {
          // Extract the matched route for the message
          const match = line.match(pattern);
          const routeStr = match ? match[0] : "route";
          reportWarning(
            filePath,
            i + 1,
            routeStr,
            `Hardcoded route detected. Use ROUTES constant instead: ${routeStr.slice(0, 50)}`,
          );
          break; // Only report once per line
        }
      }
    }
  }

  // Process all TypeScript/JavaScript files in src/
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });

  for (const filePath of files) {
    checkFile(filePath);
  }

  return {
    passed: CONFIG.strictness === "warn" ? true : warningCount === 0,
    errors: CONFIG.strictness === "error" ? warningCount : 0,
    warnings: CONFIG.strictness === "warn" ? warningCount : 0,
    detail: warningCount > 0 ? `${warningCount} hardcoded route(s)` : null,
    messages: warnings,
  };
}
