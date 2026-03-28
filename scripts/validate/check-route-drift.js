/**
 * CHECK: Route Drift
 *
 * Cross-checks the shared ROUTES map against TanStack file-route definitions.
 *
 * Enforced. New drift should fail CI, while a small explicit allowlist captures
 * known architectural exceptions:
 * - shared route config entries that intentionally do not map to app route files
 * - public route files that intentionally do not have ROUTES entries
 */

import fs from "node:fs";
import path from "node:path";
import { createValidatorResult } from "./result-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const ROUTES_CONFIG_PATH = path.join(ROOT, "convex", "shared", "routes.ts");
const ROUTES_DIR = path.join(ROOT, "src", "routes");

const KNOWN_CONFIG_ONLY_ROUTE_PATHS = new Map([
  ["/$orgSlug/inbox", "Shared route exists but the org inbox page is not implemented"],
  ["/$orgSlug/team", "Legacy shared route with no app surface"],
  [
    "/$orgSlug/workspaces/$workspaceSlug/board",
    "Workspace board route is configured but not implemented",
  ],
  [
    "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog",
    "Team backlog route is configured but not implemented",
  ],
  ["/outreach/google/auth", "HTTP OAuth endpoint, not a TanStack app route"],
  ["/privacy", "Shared route exists before the public page is implemented"],
  ["/terms", "Shared route exists before the public page is implemented"],
]);

const KNOWN_UNSHARED_PUBLIC_ROUTE_PATHS = new Map([
  ["/$orgSlug", "Org slug root is a redirect shell, not a shared ROUTES target"],
  ["/$orgSlug/projects/$key", "Project shell path redirects into sub-routes"],
  ["/$orgSlug/settings", "Settings root is a redirect shell, not a shared ROUTES target"],
  ["/board/$slug", "Standalone board share route is not modeled in shared ROUTES"],
]);

export function normalizePublicRoutePath(routePath) {
  if (routePath === "/_auth" || routePath === "/_auth/_app") {
    return null;
  }

  let normalizedPath = routePath;
  if (normalizedPath.startsWith("/_auth/_app")) {
    normalizedPath = normalizedPath.slice("/_auth/_app".length) || "/";
  } else if (normalizedPath.startsWith("/_auth")) {
    normalizedPath = normalizedPath.slice("/_auth".length) || "/";
  }

  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  return normalizedPath || "/";
}

export function extractRouteConfigEntries(content) {
  const entries = [];
  const lines = content.split("\n");
  const stack = [];
  const keyPattern = /^\s*(\w+)\s*:\s*\{/;
  const pathPattern = /^\s*path:\s*["'`]/;
  const closingPattern = /^\s*}\s*,?\s*$/;

  for (const line of lines) {
    const keyMatch = line.match(keyPattern);
    if (keyMatch) {
      stack.push(keyMatch[1]);
    }

    if (pathPattern.test(line)) {
      const pathMatch = line.match(/path:\s*["'`]([^"'`]+)["'`]/);
      if (pathMatch) {
        const key = stack.filter((segment) => segment !== "ROUTES").join(".");
        if (key.length > 0) {
          entries.push({ key, path: pathMatch[1] });
        }
      }
    }

    if (closingPattern.test(line)) {
      stack.pop();
    }
  }

  return entries;
}

export function extractFileRouteDefinitions(content, filePath) {
  const definitions = [];
  const routePattern = /createFileRoute\(\s*["'`]([^"'`]+)["'`]\s*,?\s*\)/gs;

  for (const match of content.matchAll(routePattern)) {
    const rawPath = match[1];
    const publicPath = normalizePublicRoutePath(rawPath);
    if (!publicPath) {
      continue;
    }

    definitions.push({
      filePath,
      rawPath,
      publicPath,
    });
  }

  return definitions;
}

export function analyzeRouteDrift({
  routeConfigEntries,
  routeDefinitions,
  knownConfigOnlyRoutePaths = KNOWN_CONFIG_ONLY_ROUTE_PATHS,
  knownUnsharedPublicRoutePaths = KNOWN_UNSHARED_PUBLIC_ROUTE_PATHS,
}) {
  const routeConfigByPath = new Map(routeConfigEntries.map((entry) => [entry.path, entry]));
  const routeDefinitionsByPath = new Map();

  for (const definition of routeDefinitions) {
    const existing = routeDefinitionsByPath.get(definition.publicPath) ?? [];
    existing.push(definition);
    routeDefinitionsByPath.set(definition.publicPath, existing);
  }

  const missingConfigPaths = [];
  for (const [routePath, entry] of routeConfigByPath.entries()) {
    if (knownConfigOnlyRoutePaths.has(routePath)) {
      continue;
    }
    if (!routeDefinitionsByPath.has(routePath)) {
      missingConfigPaths.push({
        key: entry.key,
        path: routePath,
      });
    }
  }

  const unexpectedPublicPaths = [];
  for (const [routePath, definitions] of routeDefinitionsByPath.entries()) {
    if (knownUnsharedPublicRoutePaths.has(routePath)) {
      continue;
    }
    if (!routeConfigByPath.has(routePath)) {
      unexpectedPublicPaths.push({
        path: routePath,
        files: definitions.map((definition) => definition.filePath).sort(),
      });
    }
  }

  return {
    missingConfigPaths: missingConfigPaths.sort((a, b) => a.path.localeCompare(b.path)),
    unexpectedPublicPaths: unexpectedPublicPaths.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export function findRouteTestPlacementIssues(routeFiles) {
  return routeFiles
    .map((filePath) => filePath.replaceAll("\\", "/"))
    .filter((filePath) => filePath.startsWith("src/routes/"))
    .filter((filePath) => /\.test\.tsx?$/.test(filePath))
    .filter((filePath) => !filePath.includes("/__tests__/"))
    .sort()
    .map((filePath) => ({
      filePath,
      message: "Route tests must live in an adjacent __tests__/ directory.",
    }));
}

function loadRouteDefinitions() {
  const files = walkDir(ROUTES_DIR, {
    extensions: new Set([".ts", ".tsx"]),
    skip: new Set(["node_modules", "dist", ".next", ".git"]),
  }).filter((filePath) => {
    const relative = relPath(filePath);
    return !relative.endsWith(".test.tsx") && !relative.endsWith(".test.ts");
  });

  return files.flatMap((filePath) =>
    extractFileRouteDefinitions(fs.readFileSync(filePath, "utf8"), relPath(filePath)),
  );
}

function loadRouteFiles() {
  return walkDir(ROUTES_DIR, {
    extensions: new Set([".ts", ".tsx"]),
    skip: new Set(["node_modules", "dist", ".next", ".git"]),
  }).map((filePath) => relPath(filePath));
}

export function run() {
  const routeConfigEntries = extractRouteConfigEntries(fs.readFileSync(ROUTES_CONFIG_PATH, "utf8"));
  const routeFiles = loadRouteFiles();
  const routeDefinitions = loadRouteDefinitions();
  const { missingConfigPaths, unexpectedPublicPaths } = analyzeRouteDrift({
    routeConfigEntries,
    routeDefinitions,
  });
  const routeTestPlacementIssues = findRouteTestPlacementIssues(routeFiles);

  const messages = [];

  if (missingConfigPaths.length > 0) {
    messages.push(`  ${c.red}ERROR${c.reset} Shared ROUTES entries without matching file routes:`);
    for (const entry of missingConfigPaths) {
      messages.push(`    ROUTES.${entry.key} -> ${entry.path}`);
    }
  }

  if (unexpectedPublicPaths.length > 0) {
    messages.push(`  ${c.red}ERROR${c.reset} File routes without matching shared ROUTES entries:`);
    for (const entry of unexpectedPublicPaths) {
      messages.push(`    ${entry.path} -> ${entry.files.join(", ")}`);
    }
  }

  if (routeTestPlacementIssues.length > 0) {
    messages.push(`  ${c.red}ERROR${c.reset} Route tests outside __tests__ directories:`);
    for (const issue of routeTestPlacementIssues) {
      messages.push(`    ${issue.filePath} - ${issue.message}`);
    }
  }

  const errorCount =
    missingConfigPaths.length + unexpectedPublicPaths.length + routeTestPlacementIssues.length;

  return createValidatorResult({
    errors: errorCount,
    detail:
      errorCount > 0
        ? `${errorCount} route drift finding${errorCount === 1 ? "" : "s"}`
        : "shared ROUTES, file routes, and route test placement aligned",
    messages,
  });
}
