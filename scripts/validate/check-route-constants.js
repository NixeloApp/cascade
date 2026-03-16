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
 * Enforced. Route constant issues are reported as plain errors.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

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

  // Hardcoded regex routes in toHaveURL() / waitForURL() assertions
  /toHaveURL\(\/.*signin/,
  /toHaveURL\(\/.*signup/,
  /toHaveURL\(\/.*forgot-password/,
  /toHaveURL\(\/.*\\\/onboarding/,
  /toHaveURL\(\/.*\\\/dashboard/,
  /toHaveURL\(\/.*\\\/projects/,
  /toHaveURL\(\/.*\\\/board/,
  /toHaveURL\(\/.*\\\/backlog/,
  /toHaveURL\(\/.*\\\/sprints/,
  /toHaveURL\(\/.*\\\/roadmap/,
  /toHaveURL\(\/.*\\\/timesheet/,
  /toHaveURL\(\/.*\\\/analytics/,
  /toHaveURL\(\/.*\\\/settings/,
  /toHaveURL\(\/.*\\\/workspaces/,
  /toHaveURL\(\/.*\\\/documents/,
  /toHaveURL\(\/.*\\\/issues/,

  // Bare regex with route words (no \/ prefix) — e.g. toHaveURL(/dashboard|onboarding/)
  /toHaveURL\(\/[^\\]*dashboard/,
  /toHaveURL\(\/[^\\]*onboarding/,
  /toHaveURL\(\/[^\\]*signin/,
  /toHaveURL\(\/[^\\]*signup/,

  // Inline template literals with hardcoded route segments in toHaveURL
  /toHaveURL\(new RegExp\(`[^`]*\/dashboard/,
  /toHaveURL\(new RegExp\(`[^`]*\/signin/,
  /toHaveURL\(new RegExp\(`[^`]*\/signup/,
  /toHaveURL\(new RegExp\(`[^`]*\/onboarding/,
  /toHaveURL\(new RegExp\(`[^`]*\/projects/,
  /toHaveURL\(new RegExp\(`[^`]*\/workspaces/,
  /toHaveURL\(new RegExp\(`[^`]*\/documents/,
  /toHaveURL\(new RegExp\(`[^`]*\/issues/,
];

// Files/directories to skip
const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".next",
  "_generated",
  "routeTree.gen.ts",
  "routes.ts", // The routes definition itself (both src/config/routes.ts and e2e/utils/routes.ts)
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
  /import.*from\s+["'].*routes["']/, // Importing routes module
  /toHaveURL\(new RegExp\(.*ROUTES\./, // Dynamic regex constructed from ROUTES constants
  /toHaveURL\(routePattern\(/, // routePattern() helper
  /toHaveURL\(routeMatch\(/, // routeMatch() helper
  /toHaveURL\([a-zA-Z](?!ew RegExp)/, // Variable/constant references (dashboardUrl, tabPaths, etc.) but not new RegExp
  /toHaveURL\(\/\^https/, // External URL assertions (stripe.com etc.)
  /toHaveURL\(\/\\\/\$\//, // Root path assertion
  /^\s*\*\s/, // JSDoc/block comment lines
];

export function run() {
  let issueCount = 0;
  const messages = [];

  function reportIssue(filePath, line, _match, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    issueCount++;
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
          reportIssue(
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

  // Process all TypeScript/JavaScript files in src/ and e2e/
  const SCAN_DIRS = [path.join(ROOT, "src"), path.join(ROOT, "e2e")];

  for (const scanDir of SCAN_DIRS) {
    if (!fs.existsSync(scanDir)) continue;
    const files = walkDir(scanDir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
    for (const filePath of files) {
      checkFile(filePath);
    }
  }

  return {
    passed: issueCount === 0,
    errors: issueCount,
    detail: issueCount > 0 ? `${issueCount} hardcoded route(s)` : null,
    messages,
  };
}
