/**
 * CHECK: Route Constants Usage
 *
 * Validates that route URLs use ROUTES constants instead of hardcoded strings.
 *
 * Strategy: Instead of enumerating every known route, detect the anti-patterns:
 * 1. String literals that look like route paths: "/signin", "/dashboard"
 * 2. Template literals with route segments: `/${orgSlug}/dashboard`
 * 3. Bare regex with route paths in toHaveURL: toHaveURL(/dashboard/)
 * 4. new RegExp() with inline route strings: toHaveURL(new RegExp(`/issues/...`))
 *
 * Lines are allowed if they reference ROUTES., routePattern(, routeMatch(,
 * or other known-safe patterns (external URLs, imports, API routes, etc.).
 *
 * Enforced. Route constant issues are reported as plain errors.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Generic detection: lines with path-like strings that should use ROUTES
const ROUTE_PATTERNS = [
  // String literals with leading slash + path segments, optional trailing /, ?, #
  {
    regex: /["'`]\/[a-z0-9][-a-z0-9]+(\/[a-z0-9][-a-z0-9]*)*[/?#]?["'`]/,
    message: "Hardcoded route string",
  },

  // Template literals with hardcoded path + interpolation: `/${slug}/dashboard` or `/admin/videos/${id}`
  {
    regex: /`\/[a-z][-a-z0-9]*.*\$\{|`\/\$\{[^}]+\}\/[a-z0-9]/,
    message: "Hardcoded template literal route",
  },

  // toHaveURL with bare regex containing path-like segments: toHaveURL(/dashboard/)
  // Matches /word/ or /\/word/ but not /\/$/ (root) or /^https/ (external)
  {
    regex: /toHaveURL\(\/(?!\^https|\\\/\$).*[a-z]{4,}/,
    message: "Hardcoded regex route in toHaveURL",
  },

  // toHaveURL with new RegExp containing inline path strings (not from ROUTES)
  {
    regex: /toHaveURL\(new RegExp\(["'`][^"'`]*\/[a-z][-a-z]/,
    message: "Hardcoded route in toHaveURL RegExp",
  },

  // Standalone hardcoded regex route constants: const X = /\/admin\/path\/[^/]+$/
  {
    regex: /=\s*\/\\\/[a-z][-a-z]+(\\\/[a-z][-a-z]+)*(\\\/)?\[?\$?\//,
    message: "Hardcoded regex route constant",
  },
];

// Files/directories to skip
const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".next",
  "_generated",
  "routeTree.gen.ts",
  "convex/shared/routes.ts", // The routes definition itself
  "src/config/routes.ts", // Route config re-export
];

// Lines matching these patterns are never flagged
const ALLOWED_PATTERNS = [
  /ROUTES\./, // Using ROUTES constant
  /routePattern\(/, // routePattern() helper
  /routeMatch\(/, // routeMatch() helper
  /["'`]https?:\/\//, // External URLs
  /["'`]\/api\//, // API routes
  /["'`]#/, // Anchor links
  /["'`]mailto:/, // Email links
  /["'`]tel:/, // Phone links
  /path:\s*["'`]/, // Route path definitions (path: "/...")
  /createFileRoute/, // TanStack Router route definitions
  /import.*from\s+["']/, // Import statements
  /^\s*\*\s/, // JSDoc/block comment lines
  /^\s*\/\//, // Single-line comments
  /isActive\(/, // Nav-active prefix checks (pathname.includes)
  /toHaveURL\(\/\\\/\$\//, // Root path assertion: toHaveURL(/\/$/)
  /toHaveURL\(\/\^https/, // External URL assertion: toHaveURL(/^https/)
  /["']\/app["']/, // App fallback redirect path
  /\.includes\(/, // URL.includes() checks (string comparison, not navigation)
  /\.stories\./, // Storybook files use fake paths
  /["']\/co["']/, // Slash command text, not a route
  /["']\/home["']/, // Generic test href, not an app route
  /["'`]\/google\//, // External OAuth callback paths
  /["'`]\/v[0-9]+\//, // External API version paths (/v1/userinfo)
  /\[href[*^$~|]?=/, // CSS attribute selectors: [href*='/path/'], [href^='/']
];

// Files where hardcoded paths are expected (not real app routes)
const SKIP_FILE_PATTERNS = [
  /\.stories\.tsx?$/, // Storybook story files
  /screenshot-pages\.ts$/, // Screenshot utility
  /src\/.*\.test\.tsx?$/, // Unit test files use fixture paths
  /src\/.*\.spec\.tsx?$/, // Unit spec files use fixture paths
];

export function run() {
  let issueCount = 0;
  const messages = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) return;
    if (SKIP_FILE_PATTERNS.some((pattern) => pattern.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Patterns that are violations even when ROUTES. is on the line
    const ALWAYS_CHECK = [
      {
        regex: /ROUTES\.[a-zA-Z_.]+\}\/\[/,
        message: "Use ROUTES .build() instead of ROUTES constant + inline regex",
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check always-flagged patterns first (even if ROUTES. is present)
      let alwaysFlagged = false;
      for (const { regex, message } of ALWAYS_CHECK) {
        if (regex.test(line)) {
          const match = line.match(regex);
          const snippet = match ? match[0].slice(0, 50) : "";
          messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${i + 1} - ${message}: ${snippet}`);
          issueCount++;
          alwaysFlagged = true;
          break;
        }
      }
      if (alwaysFlagged) continue;

      // Skip if line has allowed patterns
      if (ALLOWED_PATTERNS.some((pattern) => pattern.test(line))) continue;

      // Check for hardcoded route patterns
      for (const { regex, message } of ROUTE_PATTERNS) {
        if (regex.test(line)) {
          const match = line.match(regex);
          const snippet = match ? match[0].slice(0, 50) : "";
          messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${i + 1} - ${message}: ${snippet}`);
          issueCount++;
          break; // Only report once per line
        }
      }
    }
  }

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
