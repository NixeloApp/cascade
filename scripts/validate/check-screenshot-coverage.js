/**
 * CHECK: Screenshot Coverage
 *
 * Audits two visual-maintenance signals:
 *   1. Route coverage — compares routes defined in convex/shared/routes.ts
 *      against ROUTES references in e2e/screenshot-pages.ts.
 *   2. Canonical spec variants — checks that each design spec screenshot
 *      directory contains the expected baseline captures.
 *
 * Informational only — does not block CI. Some routes legitimately cannot be
 * captured (onboarding, verify-email, etc.), and some spec folders are still
 * maintained incrementally.
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
  "invite", // Captured via literal URL "/invite/screenshot-test-token", not ROUTES ref
  "inbox", // Route defined in routes.ts but page not implemented
  "workspaces.board", // Route defined in routes.ts but page not implemented
  "workspaces.teams.backlog", // Route defined but page doesn't exist
  "workspaces.teams.list", // No standalone teams list page (only team detail sub-pages)
  "onboarding", // Requires fresh user state, can't capture with seeded test user
  "invoices.detail", // Requires creating an invoice first; list page is captured
]);

const EXPECTED_PAGE_SPEC_SCREENSHOTS = [
  "desktop-dark.png",
  "desktop-light.png",
  "tablet-light.png",
  "mobile-light.png",
];
const EXPECTED_MODAL_SPEC_SCREENSHOTS = [
  "desktop-dark",
  "desktop-light",
  "tablet-light",
  "mobile-light",
];
const REQUIRED_PAGE_SPECS = [
  {
    folder: "30-meetings",
    label: "meetings",
    requireDocs: true,
    requireScreenshots: true,
  },
];

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
    [/workspaces\\.+backlog/, "workspaces.backlog"],
    [/workspaces\\.+sprints/, "workspaces.sprints"],
    [/workspaces\\.+dependencies/, "workspaces.dependencies"],
    [/workspaces\\.+wiki/, "workspaces.wiki"],
    [/workspaces\\.+settings/, "workspaces.settings"],
    // Note: workspaces.teams.list is NOT covered — no teams index screenshot exists.
    // Team detail/sub-routes are covered via individual matchers below.
    [/teams\\.+board/, "workspaces.teams.board"],
    [/teams\\.+backlog/, "workspaces.teams.backlog"],
    [/teams\\.+calendar/, "workspaces.teams.calendar"],
    [/teams\\.+wiki/, "workspaces.teams.wiki"],
    [/teams\\.+settings/, "workspaces.teams.settings"],
    [/takeScreenshot.*team-/, "workspaces.teams.detail"],
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

  // String concatenation: `${wsBase}/backlog` or `${teamBase}/board`
  // Require the base variable and segment on the same line to avoid false positives.
  const lines = content.split("\n");
  const CONCAT_PAIRS = [
    {
      base: "wsBase",
      prefix: "workspaces",
      segments: ["backlog", "sprints", "dependencies", "wiki", "settings", "calendar"],
    },
    {
      base: "teamBase",
      prefix: "workspaces.teams",
      segments: ["board", "backlog", "calendar", "wiki", "settings"],
    },
  ];
  for (const { base, prefix, segments } of CONCAT_PAIRS) {
    for (const segment of segments) {
      const hasConcat = lines.some((line) => line.includes(base) && line.includes(`/${segment}`));
      if (hasConcat && !refs.has(`${prefix}.${segment}`)) {
        refs.add(`${prefix}.${segment}`);
      }
    }
  }

  return refs;
}

function collectSpecScreenshotCoverageGaps() {
  const specsBaseDir = path.join(ROOT, "docs", "design", "specs", "pages");
  if (!fs.existsSync(specsBaseDir)) {
    return [];
  }

  const gaps = [];

  for (const entry of fs.readdirSync(specsBaseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const screenshotDir = path.join(specsBaseDir, entry.name, "screenshots");
    if (!fs.existsSync(screenshotDir)) continue;

    const screenshotFiles = new Set(fs.readdirSync(screenshotDir));
    const missingFiles = EXPECTED_PAGE_SPEC_SCREENSHOTS.filter(
      (file) => !screenshotFiles.has(file),
    );

    if (missingFiles.length > 0) {
      gaps.push({
        specFolder: entry.name,
        missingFiles,
      });
    }
  }

  return gaps.sort((a, b) => a.specFolder.localeCompare(b.specFolder));
}

function collectPageSpecDocGaps() {
  const specsBaseDir = path.join(ROOT, "docs", "design", "specs", "pages");
  if (!fs.existsSync(specsBaseDir)) {
    return [];
  }

  const requiredDocs = ["CURRENT.md", "IMPLEMENTATION.md", "TARGET.md"];
  const gaps = [];

  for (const entry of fs.readdirSync(specsBaseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const pageDir = path.join(specsBaseDir, entry.name);
    const missingDocs = requiredDocs.filter((file) => !fs.existsSync(path.join(pageDir, file)));

    if (missingDocs.length > 0) {
      gaps.push({
        pageFolder: entry.name,
        missingDocs,
      });
    }
  }

  return gaps.sort((a, b) => a.pageFolder.localeCompare(b.pageFolder));
}

function collectRequiredPageSpecGaps() {
  const specsBaseDir = path.join(ROOT, "docs", "design", "specs", "pages");
  if (!fs.existsSync(specsBaseDir)) {
    return REQUIRED_PAGE_SPECS.map((spec) => ({
      ...spec,
      missingFolder: true,
      missingDocs: spec.requireDocs ? ["CURRENT.md", "IMPLEMENTATION.md", "TARGET.md"] : [],
      missingScreenshotsDir: spec.requireScreenshots,
      missingScreenshotFiles: spec.requireScreenshots ? [...EXPECTED_PAGE_SPEC_SCREENSHOTS] : [],
    }));
  }

  const requiredDocs = ["CURRENT.md", "IMPLEMENTATION.md", "TARGET.md"];
  const gaps = [];

  for (const spec of REQUIRED_PAGE_SPECS) {
    const pageDir = path.join(specsBaseDir, spec.folder);
    const screenshotDir = path.join(pageDir, "screenshots");
    const pageExists = fs.existsSync(pageDir);
    const screenshotsExist = fs.existsSync(screenshotDir);
    const screenshotFiles = screenshotsExist ? new Set(fs.readdirSync(screenshotDir)) : new Set();
    const missingDocs =
      spec.requireDocs && pageExists
        ? requiredDocs.filter((file) => !fs.existsSync(path.join(pageDir, file)))
        : spec.requireDocs
          ? [...requiredDocs]
          : [];
    const missingScreenshotFiles =
      spec.requireScreenshots && screenshotsExist
        ? EXPECTED_PAGE_SPEC_SCREENSHOTS.filter((file) => !screenshotFiles.has(file))
        : spec.requireScreenshots
          ? [...EXPECTED_PAGE_SPEC_SCREENSHOTS]
          : [];

    if (
      !pageExists ||
      missingDocs.length > 0 ||
      !screenshotsExist ||
      missingScreenshotFiles.length > 0
    ) {
      gaps.push({
        ...spec,
        missingFolder: !pageExists,
        missingDocs,
        missingScreenshotsDir: spec.requireScreenshots && !screenshotsExist,
        missingScreenshotFiles,
      });
    }
  }

  return gaps.sort((a, b) => a.folder.localeCompare(b.folder));
}

function collectModalScreenshotCoverageGaps() {
  const modalsReadme = path.join(ROOT, "docs", "design", "specs", "modals", "README.md");
  const modalsScreenshotDir = path.join(ROOT, "docs", "design", "specs", "modals", "screenshots");

  if (!fs.existsSync(modalsReadme) || !fs.existsSync(modalsScreenshotDir)) {
    return [];
  }

  const content = fs.readFileSync(modalsReadme, "utf-8");
  const gaps = [];
  const tableRowPattern = /^\|\s*[^|]+\|\s*🟢 SPEC'D\s*\|\s*`([^`]+)`\s*\|$/gm;

  for (const match of content.matchAll(tableRowPattern)) {
    const specFile = match[1];
    const specBaseName = path.basename(specFile, ".md");
    const missingFiles = EXPECTED_MODAL_SPEC_SCREENSHOTS.filter(
      (variant) => !fs.existsSync(path.join(modalsScreenshotDir, `${specBaseName}-${variant}.png`)),
    );

    if (missingFiles.length > 0) {
      gaps.push({
        modalSpec: specBaseName,
        missingFiles,
      });
    }
  }

  return gaps.sort((a, b) => a.modalSpec.localeCompare(b.modalSpec));
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
  const missingSpecVariants = collectSpecScreenshotCoverageGaps();
  const missingPageSpecDocs = collectPageSpecDocGaps();
  const missingRequiredPageSpecs = collectRequiredPageSpecGaps();
  const missingModalSpecVariants = collectModalScreenshotCoverageGaps();

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

  if (missingSpecVariants.length > 0) {
    messages.push(
      `${c.yellow}Spec screenshot folders missing canonical variants (${missingSpecVariants.length}):${c.reset}`,
    );
    for (const gap of missingSpecVariants) {
      messages.push(
        `  ${c.dim}docs/design/specs/pages/${gap.specFolder}/screenshots${c.reset} missing ${gap.missingFiles.join(", ")}`,
      );
    }
  }

  if (missingPageSpecDocs.length > 0) {
    messages.push(
      `${c.yellow}Page specs missing required CURRENT/IMPLEMENTATION/TARGET docs (${missingPageSpecDocs.length}):${c.reset}`,
    );
    for (const gap of missingPageSpecDocs) {
      messages.push(
        `  ${c.dim}docs/design/specs/pages/${gap.pageFolder}${c.reset} missing ${gap.missingDocs.join(", ")}`,
      );
    }
  }

  if (missingRequiredPageSpecs.length > 0) {
    messages.push(
      `${c.yellow}Required page specs missing coverage assets (${missingRequiredPageSpecs.length}):${c.reset}`,
    );
    for (const gap of missingRequiredPageSpecs) {
      const missingParts = [];
      if (gap.missingFolder) {
        missingParts.push("folder");
      }
      if (gap.missingDocs.length > 0) {
        missingParts.push(gap.missingDocs.join(", "));
      }
      if (gap.missingScreenshotsDir) {
        missingParts.push("screenshots/");
      }
      if (gap.missingScreenshotFiles.length > 0 && !gap.missingScreenshotsDir) {
        missingParts.push(gap.missingScreenshotFiles.join(", "));
      }
      messages.push(
        `  ${c.dim}docs/design/specs/pages/${gap.folder}${c.reset} (${gap.label}) missing ${missingParts.join("; ")}`,
      );
    }
  }

  if (missingModalSpecVariants.length > 0) {
    messages.push(
      `${c.yellow}Modal specs missing canonical screenshots (${missingModalSpecVariants.length}):${c.reset}`,
    );
    for (const gap of missingModalSpecVariants) {
      messages.push(
        `  ${c.dim}docs/design/specs/modals/screenshots${c.reset} missing ${gap.modalSpec}-{${gap.missingFiles.join(", ")}}.png`,
      );
    }
  }

  const completeSpecFolders = (() => {
    const specsBaseDir = path.join(ROOT, "docs", "design", "specs", "pages");
    if (!fs.existsSync(specsBaseDir)) return 0;
    return fs
      .readdirSync(specsBaseDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && fs.existsSync(path.join(specsBaseDir, entry.name, "screenshots")),
      ).length;
  })();
  const specsWithCanonicalVariants = completeSpecFolders - missingSpecVariants.length;

  // Informational — never blocks CI, but shows uncovered routes in output
  return {
    passed: true,
    errors: 0,
    showMessagesOnPass:
      uncovered.length > 0 ||
      missingSpecVariants.length > 0 ||
      missingPageSpecDocs.length > 0 ||
      missingRequiredPageSpecs.length > 0 ||
      missingModalSpecVariants.length > 0,
    detail:
      uncovered.length > 0 ||
      missingSpecVariants.length > 0 ||
      missingPageSpecDocs.length > 0 ||
      missingRequiredPageSpecs.length > 0 ||
      missingModalSpecVariants.length > 0
        ? `${allRouteKeys.length - uncovered.length}/${allRouteKeys.length} routes covered, ${specsWithCanonicalVariants}/${completeSpecFolders} page spec folders have canonical screenshots, ${missingModalSpecVariants.length === 0 ? "all" : "not all"} spec'd modals have canonical screenshots`
        : `all ${allRouteKeys.length} routes covered, all ${completeSpecFolders} page spec folders have canonical screenshots, all spec'd modals have canonical screenshots`,
    messages,
  };
}
