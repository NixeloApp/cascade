/**
 * CHECK: Screenshot Route Coverage
 *
 * Compares routes defined in convex/shared/routes.ts against ROUTES references
 * in e2e/screenshot-pages.ts to find routes with no screenshot coverage.
 *
 * Informational only — does not block CI. Some routes legitimately cannot be
 * captured (onboarding, portal, verify-email, etc.).
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT } from "./utils.js";

// Routes that are intentionally not screenshotted
const EXCLUDED_ROUTES = new Set([
  "app", // Redirect-only route
  "terms", // Route doesn't exist yet
  "privacy", // Route doesn't exist yet
  "team", // Legacy route
  "workspaces.teams.backlog", // Route defined but page doesn't exist
]);

/**
 * Extract all dotted route keys from convex/shared/routes.ts.
 * Parses nested objects to produce keys like "documents.list", "projects.board", etc.
 */
function extractRouteKeys(content) {
  const keys = [];

  // Match path: "/..." lines and work backwards to reconstruct the key
  // Strategy: find all `path:` assignments and trace the object nesting
  const lines = content.split("\n");
  const stack = [];
  const KEY_RE = /^\s*(\w+)\s*:\s*\{/;
  const PATH_RE = /^\s*path:\s*["']/;
  const CLOSE_RE = /^\s*\}/;

  for (const line of lines) {
    const keyMatch = line.match(KEY_RE);
    if (keyMatch) {
      stack.push(keyMatch[1]);
    }

    if (PATH_RE.test(line)) {
      // Current stack represents the route key path
      // Filter out "ROUTES" wrapper if present
      const routeKey = stack.filter((k) => k !== "ROUTES").join(".");
      if (routeKey) keys.push(routeKey);
    }

    if (CLOSE_RE.test(line) && !line.includes("{")) {
      stack.pop();
    }
  }

  return keys;
}

/**
 * Extract all ROUTES.xxx references from screenshot-pages.ts.
 * Returns a Set of dotted keys like "documents.list", "signin", etc.
 *
 * Also detects URL-pattern-based coverage (regex helpers like isWorkspaceBacklogUrl)
 * and string concatenation (wsBase + "/backlog") which cover routes without
 * direct ROUTES.xxx references.
 */
function extractScreenshotRouteRefs(content) {
  const refs = new Set();

  // Direct ROUTES.xxx references
  for (const match of content.matchAll(/ROUTES\.([a-zA-Z0-9.]+)/g)) {
    const key = match[1].replace(/\.(build|path)$/, "");
    refs.add(key);
  }

  // URL-pattern coverage: regex helpers like /\/workspaces\/[^/]+\/backlog$/
  // Map path segments to route keys
  // Regex source in TS uses escaped slashes: teams\/[^/]+\/board
  // We match these escaped forms in the raw file text
  const URL_PATTERN_MAP = [
    [/workspaces\\.+board/, "workspaces.board"],
    [/workspaces\\.+backlog/, "workspaces.backlog"],
    [/workspaces\\.+sprints/, "workspaces.sprints"],
    [/workspaces\\.+dependencies/, "workspaces.dependencies"],
    [/workspaces\\.+wiki/, "workspaces.wiki"],
    [/workspaces\\.+settings/, "workspaces.settings"],
    [/workspaces\\.+teams/, "workspaces.teams.list"],
    [/teams\\.+board/, "workspaces.teams.board"],
    [/teams\\.+backlog/, "workspaces.teams.backlog"],
    [/teams\\.+calendar/, "workspaces.teams.calendar"],
    [/teams\\.+wiki/, "workspaces.teams.wiki"],
    [/teams\\.+settings/, "workspaces.teams.settings"],
    [/isTeamDetailUrl|teams\\.+\$/, "workspaces.teams.detail"],
    [/projects\\.+inbox/, "projects.inbox"],
    [/projects\\.+activity/, "projects.activity"],
    [/projects\\.+analytics/, "projects.analytics"],
    [/projects\\.+billing/, "projects.billing"],
    [/projects\\.+timesheet/, "projects.timesheet"],
    [/projects\\.+settings/, "projects.settings"],
  ];

  for (const [pattern, key] of URL_PATTERN_MAP) {
    if (pattern.test(content)) {
      refs.add(key);
    }
  }

  // String concatenation: `${wsBase}/backlog` or wsBase + "/backlog"
  const CONCAT_SEGMENTS = [
    "backlog",
    "board",
    "sprints",
    "dependencies",
    "wiki",
    "settings",
    "calendar",
    "inbox",
    "activity",
    "analytics",
    "billing",
    "timesheet",
  ];
  for (const segment of CONCAT_SEGMENTS) {
    if (content.includes(`/${segment}`) && content.includes("wsBase")) {
      // Workspace sub-routes via concatenation
      if (!refs.has(`workspaces.${segment}`)) {
        refs.add(`workspaces.${segment}`);
      }
    }
  }

  return refs;
}

export function run() {
  const routesFile = path.join(ROOT, "convex/shared/routes.ts");
  const screenshotFile = path.join(ROOT, "e2e/screenshot-pages.ts");

  if (!fs.existsSync(routesFile) || !fs.existsSync(screenshotFile)) {
    return { passed: true, errors: 0, detail: "files not found, skipped", messages: [] };
  }

  const routesContent = fs.readFileSync(routesFile, "utf-8");
  const screenshotContent = fs.readFileSync(screenshotFile, "utf-8");

  const allRouteKeys = extractRouteKeys(routesContent);
  const capturedRefs = extractScreenshotRouteRefs(screenshotContent);

  const uncovered = [];
  for (const key of allRouteKeys) {
    if (EXCLUDED_ROUTES.has(key)) continue;
    if (capturedRefs.has(key)) continue;

    // Check if a parent key is referenced (e.g. "issues" covers "issues.list")
    const parts = key.split(".");
    let parentCovered = false;
    for (let i = 1; i < parts.length; i++) {
      if (capturedRefs.has(parts.slice(0, i).join("."))) {
        parentCovered = true;
        break;
      }
    }
    if (parentCovered) continue;

    uncovered.push(key);
  }

  const messages = [];
  if (uncovered.length > 0) {
    messages.push(
      `${c.yellow}Routes without screenshot coverage (${uncovered.length}/${allRouteKeys.length}):${c.reset}`,
    );
    for (const key of uncovered) {
      messages.push(`  ${c.dim}ROUTES.${key}${c.reset}`);
    }
  }

  // Informational — never blocks CI
  return {
    passed: true,
    errors: 0,
    detail:
      uncovered.length > 0
        ? `${allRouteKeys.length - uncovered.length}/${allRouteKeys.length} routes covered (${uncovered.length} uncovered)`
        : `all ${allRouteKeys.length} routes covered`,
    messages,
  };
}
