/**
 * Visual screenshot tool for reviewing all app pages.
 *
 * Captures screenshots across viewport/theme combinations:
 *   - desktop-dark (1920x1080)
 *   - desktop-light (1920x1080)
 *   - tablet-light (768x1024)
 *   - mobile-light (390x844)
 *
 * Output: Screenshots go to their corresponding spec folders:
 *   - docs/design/specs/pages/02-signin/screenshots/
 *   - docs/design/specs/pages/03-signup/screenshots/
 *   - etc.
 *
 * Pages without specs go to: e2e/screenshots/ (flat folder)
 *
 * Usage:
 *   pnpm screenshots              # capture all
 *   pnpm screenshots -- --headed  # visible browser
 *   pnpm screenshots -- --spec 11-calendar --config mobile-light
 *   pnpm screenshots -- --spec calendar --match event
 *
 * Requires dev server running (pnpm dev).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type Browser, chromium, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../src/lib/test-ids";
import { TEST_USERS } from "./config";
import { E2E_TIMEZONE } from "./constants";
import { ProjectsPage } from "./pages";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SPECS_BASE_DIR = path.join(process.cwd(), "docs", "design", "specs", "pages");
const FALLBACK_SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");
const SCREENSHOT_STAGING_BASE_DIR = path.join(process.cwd(), ".tmp", "screenshot-staging");

// Map page identifiers to their spec folder names
// Pages with specs get screenshots in their spec folder
// Pages without specs go to the fallback directory
const PAGE_TO_SPEC_FOLDER: Record<string, string> = {
  // Public pages
  "public-landing": "01-landing",
  "public-signin": "02-signin",
  "public-signup": "03-signup",
  "public-forgot-password": "04-forgot-password",

  // Workspace-level pages (empty states)
  "empty-dashboard": "04-dashboard",
  "empty-projects": "05-projects",
  "empty-documents": "09-documents",
  "empty-settings": "12-settings",
  "empty-issues": "19-issues",
  "empty-notifications": "21-notifications",
  "empty-my-issues": "20-my-issues",
  "empty-invoices": "25-invoices",
  "empty-clients": "26-clients",

  // Workspace-level pages (filled states)
  "filled-dashboard": "04-dashboard",
  "filled-projects": "05-projects",
  "filled-documents": "09-documents",
  "filled-settings": "12-settings",
  "filled-issues": "19-issues",
  "filled-notifications": "21-notifications",
  "filled-my-issues": "20-my-issues",
  "filled-org-calendar": "23-org-calendar",
  "filled-org-analytics": "24-org-analytics",
  "filled-invoices": "25-invoices",
  "filled-clients": "26-clients",

  // Project sub-pages (filled states) - these use dynamic keys
  // Pattern: filled-project-{key}-{tab}
  // We'll handle these with a prefix match below
};

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

// Desktop captures both themes, tablet/mobile light only
const CONFIGS: Array<{ viewport: keyof typeof VIEWPORTS; theme: "dark" | "light" }> = [
  { viewport: "desktop", theme: "dark" },
  { viewport: "desktop", theme: "light" },
  { viewport: "tablet", theme: "light" },
  { viewport: "mobile", theme: "light" },
];

type ViewportName = keyof typeof VIEWPORTS;
type ThemeName = "dark" | "light";

const SCREENSHOT_USER = {
  email: TEST_USERS.teamLead.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamLead.password,
};
const SEARCH_SHORTCUT = process.platform === "darwin" ? "Meta+K" : "Control+K";

/** Inject Convex auth tokens into the page's localStorage. */
async function injectAuthTokens(
  page: Page,
  token: string,
  refreshToken: string | null,
): Promise<void> {
  await page.evaluate(
    ({ token, refreshToken, convexUrl }) => {
      localStorage.setItem("convexAuthToken", token);
      if (refreshToken) {
        localStorage.setItem("convexAuthRefreshToken", refreshToken);
      }
      if (convexUrl) {
        const ns = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
        localStorage.setItem(`__convexAuthJWT_${ns}`, token);
        if (refreshToken) {
          localStorage.setItem(`__convexAuthRefreshToken_${ns}`, refreshToken);
        }
      }
    },
    { token, refreshToken, convexUrl: CONVEX_URL },
  );
}

interface CliOptions {
  headless: boolean;
  configFilters: Set<string> | null;
  specFilters: string[];
  matchFilters: string[];
  help: boolean;
}

interface CaptureTarget {
  pageId: string;
  specFolder: string | null;
  filenameSuffix: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentConfigPrefix = ""; // e.g. "desktop-dark", "tablet-light"
let counters = new Map<string, number>();
let totalScreenshots = 0;
let stagingRootDir = "";
let captureFailures = 0;
let cliOptions: CliOptions = {
  headless: true,
  configFilters: null,
  specFilters: [],
  matchFilters: [],
  help: false,
};

function resetCounters(): void {
  counters = new Map<string, number>();
}

function nextIndex(prefix: string): number {
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return n;
}

// ---------------------------------------------------------------------------
// Screenshot helpers
// ---------------------------------------------------------------------------

// Dynamic page patterns that map to spec folders
// Pattern: [regex to match pageId, spec folder, filename suffix]
const DYNAMIC_PAGE_PATTERNS: Array<[RegExp, string, string]> = [
  [/^filled-dashboard-omnibox$/, "04-dashboard", "-omnibox"],
  [/^filled-dashboard-advanced-search-modal$/, "04-dashboard", "-advanced-search-modal"],
  [/^filled-dashboard-shortcuts-modal$/, "04-dashboard", "-shortcuts-modal"],
  [/^filled-dashboard-time-entry-modal$/, "04-dashboard", "-time-entry-modal"],
  [/^filled-projects-create-project-modal$/, "05-projects", "-create-project-modal"],
  // Project board: filled-project-xxx-board → 06-board
  [/^filled-project-[^-]+-board$/, "06-board", ""],
  [/^filled-project-[^-]+-create-issue-modal$/, "06-board", "-create-issue-modal"],
  // Project backlog: filled-project-xxx-backlog → 07-backlog
  [/^filled-project-[^-]+-backlog$/, "07-backlog", ""],
  // Project sprints: filled-project-xxx-sprints → 18-sprints
  [/^filled-project-[^-]+-sprints$/, "18-sprints", ""],
  // Issue detail: filled-issue-xxx → 08-issue
  [/^filled-issue-/, "08-issue", ""],
  [/^filled-project-[^-]+-issue-detail-modal$/, "08-issue", "-detail-modal"],
  // Document editor: filled-document-editor → 10-editor
  [/^filled-document-editor$/, "10-editor", ""],
  // Project calendar views: filled-project-xxx-calendar, filled-calendar-{mode}
  [/^filled-project-[^-]+-calendar$/, "11-calendar", ""],
  [/^filled-calendar-(day|week|month)$/, "11-calendar", "-$1"],
  [/^filled-calendar-event-modal$/, "11-calendar", "-event-modal"],
  // Project analytics: filled-project-xxx-analytics → 13-analytics
  [/^filled-project-[^-]+-analytics$/, "13-analytics", ""],
  // Project settings: filled-project-xxx-settings → 12-settings
  [/^filled-project-[^-]+-settings$/, "12-settings", "-project"],
  // Project roadmap: filled-project-xxx-roadmap → 35-roadmap
  [/^filled-project-[^-]+-roadmap$/, "35-roadmap", ""],
  // Project activity: filled-project-xxx-activity → 36-activity
  [/^filled-project-[^-]+-activity$/, "36-activity", ""],
  // Project billing: filled-project-xxx-billing → 37-billing
  [/^filled-project-[^-]+-billing$/, "37-billing", ""],
  // Project timesheet: filled-project-xxx-timesheet → 38-timesheet
  [/^filled-project-[^-]+-timesheet$/, "38-timesheet", ""],
  // Project inbox: filled-project-xxx-inbox → 39-project-inbox
  [/^filled-project-[^-]+-inbox$/, "39-project-inbox", ""],
];

function parseCsvValues(rawValues: string[]): string[] {
  return rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function collectFlagValues(args: string[], flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const current = args[index];
    if (current === flag) {
      const next = args[index + 1];
      if (next && !next.startsWith("--")) {
        values.push(next);
        index++;
      }
      continue;
    }

    if (current.startsWith(`${flag}=`)) {
      values.push(current.slice(flag.length + 1));
    }
  }

  return parseCsvValues(values);
}

function parseCliOptions(args: string[]): CliOptions {
  const configFilters = collectFlagValues(args, "--config");
  const specFilters = collectFlagValues(args, "--spec").map((value) => value.toLowerCase());
  const matchFilters = collectFlagValues(args, "--match").map((value) => value.toLowerCase());

  return {
    headless: !args.includes("--headed"),
    configFilters: configFilters.length > 0 ? new Set(configFilters) : null,
    specFilters,
    matchFilters,
    help: args.includes("--help"),
  };
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  pnpm screenshots");
  console.log("  pnpm screenshots -- --headed");
  console.log("  pnpm screenshots -- --spec 11-calendar --config mobile-light");
  console.log(
    "  pnpm screenshots -- --spec calendar --match event --config desktop-light,mobile-light",
  );
  console.log("");
  console.log("Flags:");
  console.log("  --headed              Run the browser visibly");
  console.log("  --config <list>       Filter configs, e.g. desktop-light,mobile-light");
  console.log("  --spec <list>         Filter spec folders or names, e.g. 11-calendar,settings");
  console.log(
    "  --match <list>        Filter by page id/name/spec substring, e.g. calendar,event-modal",
  );
  console.log("  --help                Show this help");
}

function resolveCaptureTarget(prefix: string, name: string): CaptureTarget {
  const pageId = `${prefix}-${name}`;

  let specFolder = PAGE_TO_SPEC_FOLDER[pageId] ?? null;
  let filenameSuffix = "";

  if (!specFolder) {
    for (const [pattern, folder, suffix] of DYNAMIC_PAGE_PATTERNS) {
      if (pattern.test(pageId)) {
        specFolder = folder;
        const match = pageId.match(pattern);
        filenameSuffix = suffix.replace("$1", match?.[1] ?? "");
        break;
      }
    }
  }

  return { pageId, specFolder, filenameSuffix };
}

function matchesSpecFilters(specFolder: string | null): boolean {
  if (cliOptions.specFilters.length === 0) {
    return true;
  }

  if (!specFolder) {
    return false;
  }

  const normalizedFolder = specFolder.toLowerCase();
  return cliOptions.specFilters.some((filter) => normalizedFolder.includes(filter));
}

function matchesMatchFilters(prefix: string, name: string, target: CaptureTarget): boolean {
  if (cliOptions.matchFilters.length === 0) {
    return true;
  }

  const haystacks = [prefix, name, target.pageId, target.specFolder ?? ""].map((value) =>
    value.toLowerCase(),
  );

  return cliOptions.matchFilters.some((filter) =>
    haystacks.some((candidate) => candidate.includes(filter)),
  );
}

function isConfigSelected(viewport: ViewportName, theme: ThemeName): boolean {
  if (!cliOptions.configFilters) {
    return true;
  }

  return cliOptions.configFilters.has(`${viewport}-${theme}`);
}

function shouldCapture(prefix: string, name: string): boolean {
  if (cliOptions.configFilters && !cliOptions.configFilters.has(currentConfigPrefix)) {
    return false;
  }

  const target = resolveCaptureTarget(prefix, name);
  return matchesSpecFilters(target.specFolder) && matchesMatchFilters(prefix, name, target);
}

function shouldCaptureAny(prefix: string, names: string[]): boolean {
  return names.some((name) => shouldCapture(prefix, name));
}

function getFinalScreenshotPath(prefix: string, name: string): string {
  const target = resolveCaptureTarget(prefix, name);

  // Filename: viewport-theme.png or viewport-theme-suffix.png
  const filename = target.filenameSuffix
    ? `${currentConfigPrefix}${target.filenameSuffix}.png`
    : `${currentConfigPrefix}.png`;

  if (target.specFolder) {
    // Page has a spec folder - put screenshot there
    const specScreenshotDir = path.join(SPECS_BASE_DIR, target.specFolder, "screenshots");
    if (!fs.existsSync(specScreenshotDir)) {
      fs.mkdirSync(specScreenshotDir, { recursive: true });
    }
    return path.join(specScreenshotDir, filename);
  }

  // No spec folder - use fallback with full naming
  const fallbackFilename = `${currentConfigPrefix}-${prefix}-${name}.png`;
  if (!fs.existsSync(FALLBACK_SCREENSHOT_DIR)) {
    fs.mkdirSync(FALLBACK_SCREENSHOT_DIR, { recursive: true });
  }
  return path.join(FALLBACK_SCREENSHOT_DIR, fallbackFilename);
}

function ensureStagingRoot(): string {
  if (!stagingRootDir) {
    throw new Error("Screenshot staging directory has not been initialized");
  }
  return stagingRootDir;
}

function getStagedScreenshotPath(finalPath: string): string {
  const relativePath = path.relative(process.cwd(), finalPath);
  const stagedPath = path.join(ensureStagingRoot(), relativePath);
  fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
  return stagedPath;
}

function getGeneratedSpecFolders(): string[] {
  return [
    ...new Set([
      ...Object.values(PAGE_TO_SPEC_FOLDER),
      ...DYNAMIC_PAGE_PATTERNS.map(([, folder]) => folder),
    ]),
  ];
}

function getStagedOutputSummary(): Map<string, number> {
  const summary = new Map<string, number>();
  const specsPrefix = path.join("docs", "design", "specs", "pages") + path.sep;
  const fallbackPrefix = path.join("e2e", "screenshots") + path.sep;

  for (const stagedFile of collectFilesRecursively(ensureStagingRoot())) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    let bucket: string | null = null;

    if (relativePath.startsWith(specsPrefix)) {
      const specRelativePath = relativePath.slice(specsPrefix.length);
      const [specFolder, screenshotsFolder] = specRelativePath.split(path.sep);
      if (specFolder && screenshotsFolder === "screenshots") {
        bucket = path.join("docs/design/specs/pages", specFolder, "screenshots");
      }
    } else if (relativePath.startsWith(fallbackPrefix)) {
      bucket = "e2e/screenshots";
    }

    if (!bucket) {
      continue;
    }

    summary.set(bucket, (summary.get(bucket) ?? 0) + 1);
  }

  return new Map([...summary.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function collectFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFilesRecursively(entryPath);
    }
    return [entryPath];
  });
}

function promoteStagedScreenshots(): void {
  const stagedFiles = collectFilesRecursively(ensureStagingRoot());

  // Build a map of target directories to the set of files that will be promoted there
  const targetDirToFiles = new Map<string, Set<string>>();
  for (const stagedFile of stagedFiles) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    const finalPath = path.join(process.cwd(), relativePath);
    const targetDir = path.dirname(finalPath);
    if (!targetDirToFiles.has(targetDir)) {
      targetDirToFiles.set(targetDir, new Set());
    }
    targetDirToFiles.get(targetDir)?.add(path.basename(finalPath));
  }

  // Delete stale screenshots only during exhaustive runs (no filters applied)
  // to avoid accidentally removing valid baselines for untargeted configs/pages
  const isExhaustiveRun =
    !cliOptions.configFilters &&
    cliOptions.specFilters.length === 0 &&
    cliOptions.matchFilters.length === 0;

  if (isExhaustiveRun) {
    for (const [targetDir, expectedFiles] of targetDirToFiles) {
      if (!fs.existsSync(targetDir)) continue;
      for (const existingFile of fs.readdirSync(targetDir)) {
        // Preserve reference-*.png baselines used by design review
        if (existingFile.startsWith("reference-")) continue;
        if (existingFile.endsWith(".png") && !expectedFiles.has(existingFile)) {
          const stalePath = path.join(targetDir, existingFile);
          fs.rmSync(stalePath, { force: true });
          console.log(`  🗑️  Removed stale: ${path.relative(process.cwd(), stalePath)}`);
        }
      }
    }
  }

  // Copy staged files to final locations
  for (const stagedFile of stagedFiles) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    const finalPath = path.join(process.cwd(), relativePath);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.copyFileSync(stagedFile, finalPath);
  }
}

async function takeScreenshot(
  page: Page,
  prefix: string,
  name: string,
  url: string,
): Promise<void> {
  if (!shouldCapture(prefix, name)) {
    return;
  }

  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const finalPath = getFinalScreenshotPath(prefix, name);
  const screenshotPath = getStagedScreenshotPath(finalPath);

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch {
    // Navigation timeout is acceptable -- page may still be usable
  }
  await waitForScreenshotReady(page);
  await waitForExpectedContent(page, url, name, prefix);
  await waitForScreenshotReady(page);
  await page.screenshot({ path: screenshotPath });
  totalScreenshots++;

  // Show relative path for clarity
  const relativePath = path.relative(process.cwd(), finalPath);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePath}`);
}

async function captureCurrentView(page: Page, prefix: string, name: string): Promise<void> {
  if (!shouldCapture(prefix, name)) {
    return;
  }

  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const finalPath = getFinalScreenshotPath(prefix, name);
  const screenshotPath = getStagedScreenshotPath(finalPath);

  await waitForScreenshotReady(page);
  await page.screenshot({ path: screenshotPath });
  totalScreenshots++;

  const relativePath = path.relative(process.cwd(), finalPath);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePath}`);
}

async function runCaptureStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureFailures++;
    console.log(`    ⚠️  skipped ${label}: ${message}`);
  }
}

function isCrashLikeError(message: string): boolean {
  return (
    message.includes("Target crashed") ||
    message.includes("Target page, context or browser has been closed") ||
    message.includes("Page crashed") ||
    message.includes("Browser has been closed")
  );
}

async function dismissIfOpen(page: Page, locator: Locator): Promise<void> {
  if (!(await locator.isVisible().catch(() => false))) {
    return;
  }

  await page.keyboard.press("Escape").catch(() => {});

  if (await locator.isVisible().catch(() => false)) {
    await page.mouse.click(10, 10).catch(() => {});
  }

  await locator.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
}

async function waitForDialogOverlaysToClear(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll("[data-testid='dialog-overlay'][data-state='open']").length === 0,
      undefined,
      { timeout: 5000 },
    )
    .catch(() => {});
}

async function dismissAllDialogs(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const openOverlays = await page
      .getByTestId(TEST_IDS.DIALOG.OVERLAY)
      .count()
      .catch(() => 0);
    if (openOverlays === 0) {
      break;
    }

    await page.keyboard.press("Escape").catch(() => {});
    await waitForDialogOverlaysToClear(page);

    const remainingOverlays = await page
      .getByTestId(TEST_IDS.DIALOG.OVERLAY)
      .count()
      .catch(() => 0);
    if (remainingOverlays === 0) {
      break;
    }

    await page.mouse.click(10, 10).catch(() => {});
    await waitForDialogOverlaysToClear(page);
  }
}

async function openOmnibox(page: Page, trigger: Locator, dialog: Locator): Promise<void> {
  await dismissAllDialogs(page);

  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click({ force: true });
  } else {
    await page.keyboard.press(SEARCH_SHORTCUT);
  }

  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId(TEST_IDS.SEARCH.INPUT).waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText(/jump faster across your workspace/i)
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {});
  await waitForScreenshotReady(page);
}

function isProjectBoardUrl(url: string): boolean {
  return /\/projects\/[^/]+\/board$/.test(url);
}

function isProjectBacklogUrl(url: string): boolean {
  return /\/projects\/[^/]+\/backlog$/.test(url);
}

function isDashboardUrl(url: string): boolean {
  return /\/[^/]+\/dashboard$/.test(url);
}

function isProjectCalendarUrl(url: string): boolean {
  return /\/projects\/[^/]+\/calendar$/.test(url);
}

function isProjectActivityUrl(url: string): boolean {
  return /\/projects\/[^/]+\/activity$/.test(url);
}

function isProjectAnalyticsUrl(url: string): boolean {
  return /\/projects\/[^/]+\/analytics$/.test(url);
}

function isProjectTimesheetUrl(url: string): boolean {
  return /\/projects\/[^/]+\/timesheet$/.test(url);
}

function isProjectSprintsUrl(url: string): boolean {
  return /\/projects\/[^/]+\/sprints$/.test(url);
}

function isProjectRoadmapUrl(url: string): boolean {
  return /\/projects\/[^/]+\/roadmap$/.test(url);
}

function isProjectBillingUrl(url: string): boolean {
  return /\/projects\/[^/]+\/billing$/.test(url);
}

function isProjectSettingsUrl(url: string): boolean {
  return /\/projects\/[^/]+\/settings$/.test(url);
}

function isSettingsUrl(url: string): boolean {
  return /\/[^/]+\/settings(?:\/profile)?$/.test(url);
}

function isProjectsUrl(url: string): boolean {
  return /\/[^/]+\/projects\/?$/.test(url);
}

function isIssuesUrl(url: string): boolean {
  return /\/[^/]+\/issues\/?$/.test(url);
}

function isWorkspacesUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/?$/.test(url);
}

function isTimeTrackingUrl(url: string): boolean {
  return /\/[^/]+\/time-tracking$/.test(url);
}

function isNotificationsUrl(url: string): boolean {
  return /\/[^/]+\/notifications\/?$/.test(url);
}

function isMyIssuesUrl(url: string): boolean {
  return /\/[^/]+\/my-issues\/?$/.test(url);
}

function isOrgCalendarUrl(url: string): boolean {
  return (
    /\/[^/]+\/calendar\/?$/.test(url) &&
    !url.includes("/projects/") &&
    !url.includes("/workspaces/")
  );
}

function isInvoicesUrl(url: string): boolean {
  return /\/[^/]+\/invoices\/?$/.test(url);
}

function isClientsUrl(url: string): boolean {
  return /\/[^/]+\/clients\/?$/.test(url);
}

function isProjectInboxUrl(url: string): boolean {
  return /\/projects\/[^/]+\/inbox$/.test(url);
}

function isWorkspaceDetailUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/?$/.test(url);
}

function isWorkspaceSettingsUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/settings$/.test(url);
}

function isWorkspaceBacklogUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/backlog$/.test(url);
}

function isWorkspaceCalendarUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/calendar$/.test(url);
}

function isTeamDetailUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/teams\/[^/]+\/?$/.test(url);
}

function isTeamBoardUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/teams\/[^/]+\/board$/.test(url);
}

function isTeamCalendarUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/teams\/[^/]+\/calendar$/.test(url);
}

function isTeamSettingsUrl(url: string): boolean {
  return /\/[^/]+\/workspaces\/[^/]+\/teams\/[^/]+\/settings$/.test(url);
}

function isIssueDetailUrl(url: string): boolean {
  return /\/[^/]+\/issues\/[^/]+$/.test(url);
}

function isDocumentEditorUrl(url: string): boolean {
  return /\/[^/]+\/documents\/[^/]+$/.test(url);
}

function isDocumentTemplatesUrl(url: string): boolean {
  return /\/[^/]+\/documents\/templates$/.test(url);
}

async function waitForPublicPageReady(page: Page, name: string): Promise<void> {
  if (name === "landing") {
    await page
      .getByRole("heading", { name: /replace scattered project tools/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByText(/product control tower/i)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await waitForScreenshotReady(page);
    return;
  }

  if (["signin", "signup", "forgot-password", "invite-invalid"].includes(name)) {
    await page
      .getByText(/secure account access/i)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await waitForScreenshotReady(page);
  }
}

async function waitForCalendarReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK).first().waitFor({
        state: "visible",
        timeout: 8000,
      });
      await page.locator("[data-calendar]").first().waitFor({
        state: "visible",
        timeout: 4000,
      });
      await page
        .locator("[data-loading-skeleton]")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      return true;
    } catch {
      if (attempt === 0) {
        await page
          .goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 })
          .catch(() => {});
        await waitForScreenshotReady(page);
      }
    }
  }
  return false;
}

async function waitForCalendarEvents(page: Page, timeoutMs = 8000): Promise<boolean> {
  const eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
  const attempts = Math.max(1, Math.ceil(timeoutMs / 500));
  const previousButton = page.getByRole("button", { name: /^previous month$/i }).first();
  const nextButton = page.getByRole("button", { name: /^next month$/i }).first();

  const waitForCalendarState = async () => {
    await waitForScreenshotReady(page);
    await waitForCalendarReady(page);
  };

  const navigateUntilVisible = async (direction: "previous" | "next", steps: number) => {
    const button = direction === "previous" ? previousButton : nextButton;

    for (let step = 0; step < steps; step++) {
      await button.click().catch(() => {});
      await waitForCalendarState();
      if ((await eventItems.count().catch(() => 0)) > 0) {
        return true;
      }
    }

    return false;
  };

  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await eventItems.count().catch(() => 0)) > 0) {
      return true;
    }

    if (attempt === Math.floor(attempts / 2)) {
      await page
        .getByRole("button", { name: /^today$/i })
        .first()
        .click()
        .catch(() => {});
      await waitForCalendarState();
    }

    await waitForScreenshotReady(page);
  }

  if (await navigateUntilVisible("previous", 2)) {
    return true;
  }

  if (await navigateUntilVisible("next", 4)) {
    return true;
  }

  return false;
}

async function waitForBoardReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.BOARD.COLUMN).first().waitFor({
        state: "visible",
        timeout: 10000,
      });
      await page
        .getByText(/delivery board|kanban board|sprint board/i)
        .first()
        .waitFor({ state: "visible", timeout: 6000 })
        .catch(() => {});
      await page
        .locator("[data-loading-skeleton]")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      await page
        .getByRole("status")
        .first()
        .waitFor({ state: "hidden", timeout: 4000 })
        .catch(() => {});
      return true;
    } catch {
      if (attempt === 0) {
        await page
          .goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 })
          .catch(() => {});
        await waitForScreenshotReady(page);
      }
    }
  }

  return false;
}

async function waitForProjectsReady(page: Page, prefix?: string): Promise<void> {
  await page
    .getByRole("heading", { name: /^projects$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create project/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page
    .waitForFunction(
      (capturePrefix) => {
        const text = document.body.innerText || "";
        if (capturePrefix === "empty") {
          return text.includes("No projects yet");
        }

        if (text.includes("Client Operations Hub")) {
          return true;
        }

        return Array.from(document.querySelectorAll("a[href]")).some((link) => {
          const href = link.getAttribute("href") || "";
          return /\/projects\/[^/]+\/board$/.test(href);
        });
      },
      prefix,
      { timeout: 12000 },
    )
    .catch(() => {});
}

async function waitForIssuesReady(page: Page, prefix?: string): Promise<void> {
  await page
    .getByRole("heading", { name: /^issues$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create issue/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      (capturePrefix) => {
        const text = document.body.innerText || "";
        if (capturePrefix === "empty") {
          return text.includes("No issues found");
        }

        return (
          document.querySelector("[data-testid='issue-card']") !== null ||
          text.includes("No issues found")
        );
      },
      prefix,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForWorkspacesReady(page: Page, prefix?: string): Promise<void> {
  await page
    .getByRole("heading", { name: /^workspaces$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create workspace/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      (capturePrefix) => {
        const text = document.body.innerText || "";
        if (capturePrefix === "empty") {
          return text.includes("No workspaces yet");
        }

        return (
          text.includes("Workspace map") ||
          text.includes("Operating structure") ||
          Array.from(document.querySelectorAll("a[href]")).some((link) => {
            const href = link.getAttribute("href") || "";
            return /\/workspaces\/[^/]+/.test(href);
          })
        );
      },
      prefix,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForTimeTrackingReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /^time tracking$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("tab", { name: /time entries/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Track time with enough context to understand cost") ||
          text.includes("Select a project to continue.") ||
          text.includes("Choose a project to view burn rate and cost analysis")
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForWorkspaceDetailReady(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: /workspace sections/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("heading", { name: /^teams$/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create team/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Organize your workspace into focused teams") &&
          (text.includes("No teams yet") ||
            Array.from(document.querySelectorAll("a[href]")).some((link) => {
              const href = link.getAttribute("href") || "";
              return /\/teams\/[^/]+$/.test(href);
            }))
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForWorkspaceSettingsReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /workspace settings/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /save changes/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForWorkspaceBacklogReady(page: Page): Promise<void> {
  // Wait for actual backlog content - empty state text OR board column (issues present)
  await page
    .getByText(/backlog is empty/i)
    .or(page.getByTestId(TEST_IDS.BOARD.COLUMN).first())
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForTeamDetailReady(page: Page): Promise<void> {
  await waitForBoardReady(page);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Projects") &&
          (text.includes("Delivery board") ||
            text.includes("Kanban board") ||
            text.includes("Sprint board"))
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
}

async function waitForTeamSettingsReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /team settings/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByText(/coming soon|manage team members and preferences/i)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForIssueDetailReady(page: Page): Promise<void> {
  await page
    .getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT)
    .or(page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR))
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForDocumentsReady(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        if (!/documents/i.test(text)) {
          return false;
        }

        return Array.from(document.querySelectorAll("a[href]")).some((link) => {
          const href = link.getAttribute("href") || "";
          return /\/documents\/[^/?#]+$/.test(href) && !href.endsWith("/templates");
        });
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForDocumentEditorReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /project requirements|sprint retrospective notes/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("The team closed the auth refresh") ||
          text.includes("Teams can move from specs to execution") ||
          text.includes("Hydrate the editor from saved document versions") ||
          document.querySelector("[contenteditable='true']") !== null
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForDocumentTemplatesReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /document templates/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /new template/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Built-in Templates") ||
          text.includes("Custom Templates") ||
          text.includes("No templates yet")
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForActivityReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /project activity/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByTestId(TEST_IDS.ACTIVITY.FEED)
    .or(page.getByTestId(TEST_IDS.ACTIVITY.EMPTY_STATE))
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForAnalyticsReady(page: Page): Promise<void> {
  await page
    .getByRole("heading", { name: /analytics dashboard/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByTestId(TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page
    .locator("[data-loading-skeleton]")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForTimesheetReady(page: Page): Promise<void> {
  await page
    .getByRole("tab", { name: /time entries/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByText(/track time with enough context to understand cost/i)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForSprintsReady(page: Page): Promise<void> {
  await page
    .getByText(/sprint management/i)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /create sprint|\+ sprint/i })
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForRoadmapReady(page: Page): Promise<void> {
  await page
    .getByText(/^roadmap$/i)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Roadmap is ready for planning") ||
          text.includes("Timeline") ||
          text.includes("No issues with target dates")
        );
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForBillingReady(page: Page): Promise<void> {
  await page
    .getByText(/billing report/i)
    .first()
    .waitFor({ state: "visible", timeout: 12000 })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return text.includes("Billable Hours") || text.includes("Revenue") || text.includes("Rate");
      },
      undefined,
      { timeout: 12000 },
    )
    .catch(() => {});
  await page
    .getByRole("status")
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
}

async function waitForExpectedContent(
  page: Page,
  url: string,
  name: string,
  prefix?: string,
): Promise<void> {
  if (prefix === "public") {
    await waitForPublicPageReady(page, name);
    return;
  }

  if (isDashboardUrl(url) || name === "dashboard") {
    await page
      .getByRole("heading", { name: /^dashboard$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .locator("[data-loading-skeleton]")
      .first()
      .waitFor({ state: "hidden", timeout: 4000 })
      .catch(() => {});
    return;
  }

  if (isProjectBoardUrl(url) || isProjectBacklogUrl(url)) {
    await waitForBoardReady(page);
    return;
  }

  if (isProjectSettingsUrl(url)) {
    await page
      .getByRole("heading", { name: "Project Settings" })
      .first()
      .waitFor({
        state: "visible",
        timeout: 12000,
      })
      .catch(() => {});
    return;
  }

  if (isSettingsUrl(url) || name === "settings" || name === "settings-profile") {
    await page
      .waitForURL(
        (currentUrl) => /\/[^/]+\/settings\/profile$/.test(new URL(currentUrl).pathname),
        {
          timeout: 12000,
        },
      )
      .catch(() => {});
    await page
      .getByRole("heading", { name: /^settings$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("tab", { name: /^profile$/i })
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByText(/manage your account, integrations, and preferences/i)
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (isProjectsUrl(url) || name === "projects") {
    await waitForProjectsReady(page, prefix);
    return;
  }

  if (isIssuesUrl(url) || name === "issues") {
    await waitForIssuesReady(page, prefix);
    return;
  }

  if (isWorkspacesUrl(url) || name === "workspaces") {
    await waitForWorkspacesReady(page, prefix);
    return;
  }

  if (isTimeTrackingUrl(url) || name === "time-tracking") {
    await waitForTimeTrackingReady(page);
    return;
  }

  if (isWorkspaceDetailUrl(url) || /^workspace-[^-]+$/.test(name)) {
    await waitForWorkspaceDetailReady(page);
    return;
  }

  if (isWorkspaceSettingsUrl(url) || /^workspace-[^-]+-settings$/.test(name)) {
    await waitForWorkspaceSettingsReady(page);
    return;
  }

  if (isWorkspaceBacklogUrl(url)) {
    await waitForWorkspaceBacklogReady(page);
    return;
  }

  if (isTeamSettingsUrl(url) || /^team-[^-]+-settings$/.test(name)) {
    await waitForTeamSettingsReady(page);
    return;
  }

  if (isTeamDetailUrl(url) || isTeamBoardUrl(url) || /^team-[^-]+-board$/.test(name)) {
    await waitForTeamDetailReady(page);
    return;
  }

  if (isIssueDetailUrl(url)) {
    await waitForIssueDetailReady(page);
    return;
  }

  if (name === "documents" || /\/[^/]+\/documents\/?$/.test(url)) {
    await waitForDocumentsReady(page);
    return;
  }

  if (isDocumentTemplatesUrl(url) || name === "documents-templates") {
    await waitForDocumentTemplatesReady(page);
    return;
  }

  if (isDocumentEditorUrl(url) || name === "document-editor") {
    await waitForDocumentEditorReady(page);
    return;
  }

  if (isProjectActivityUrl(url)) {
    await waitForActivityReady(page);
    return;
  }

  if (isProjectAnalyticsUrl(url)) {
    await waitForAnalyticsReady(page);
    return;
  }

  if (isProjectTimesheetUrl(url)) {
    await waitForTimesheetReady(page);
    return;
  }

  if (isProjectSprintsUrl(url)) {
    await waitForSprintsReady(page);
    return;
  }

  if (isProjectRoadmapUrl(url)) {
    await waitForRoadmapReady(page);
    return;
  }

  if (isProjectBillingUrl(url)) {
    await waitForBillingReady(page);
    return;
  }

  if (isProjectInboxUrl(url) || name === "inbox") {
    await page
      .getByRole("heading", { name: /inbox/i })
      .or(page.getByText(/no items in inbox/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (isNotificationsUrl(url) || name === "notifications") {
    await page
      .getByRole("heading", { name: /^notifications$/i })
      .or(page.getByRole("tab", { name: /inbox/i }))
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (isMyIssuesUrl(url) || name === "my-issues") {
    await page
      .getByRole("heading", { name: /my issues/i })
      .or(page.getByText(/no issues assigned/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (isOrgCalendarUrl(url) || name === "org-calendar") {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000).catch(() => {});
    return;
  }

  if (isInvoicesUrl(url) || name === "invoices") {
    await page
      .getByRole("heading", { name: /invoices/i })
      .or(page.getByText(/no invoices/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (name === "org-analytics") {
    await waitForAnalyticsReady(page).catch(() => {});
    return;
  }

  if (isClientsUrl(url) || name === "clients") {
    await page
      .getByRole("heading", { name: /clients/i })
      .or(page.getByText(/no clients/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 })
      .catch(() => {});
    await page
      .getByRole("status")
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    return;
  }

  if (
    isProjectCalendarUrl(url) ||
    isWorkspaceCalendarUrl(url) ||
    isTeamCalendarUrl(url) ||
    name === "calendar-event-modal" ||
    /^calendar-(day|week|month)$/.test(name)
  ) {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000).catch(() => {});
  }
}

async function waitForScreenshotReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  // App shell loading indicator may appear during route/query transitions.
  const loadingSpinner = page
    .getByLabel("Loading")
    .or(page.getByRole("status").filter({ has: page.getByRole("status") }))
    .or(page.locator("[data-loading-spinner]"))
    .first();
  await loadingSpinner.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  // Wait two animation frames so paint/layout settles before screenshot.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
}

async function discoverFirstHref(page: Page, pattern: RegExp): Promise<string | null> {
  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const match = href.match(pattern);
        if (match?.[1]) return match[1];
      }
    }
  } catch {}
  return null;
}

async function discoverIssueKey(
  page: Page,
  orgSlug: string,
  projectKey: string,
): Promise<string | null> {
  const candidatePaths = [
    `/${orgSlug}/issues`,
    `/${orgSlug}/projects/${projectKey}/backlog`,
    `/${orgSlug}/projects/${projectKey}/board`,
  ];

  for (const pathName of candidatePaths) {
    await page
      .goto(`${BASE_URL}${pathName}`, { waitUntil: "domcontentloaded", timeout: 15000 })
      .catch(() => {});
    await waitForExpectedContent(page, pathName, "issues");
    await waitForScreenshotReady(page);

    const issueKey = await discoverFirstHref(page, /\/issues\/([^/?#]+)/);
    if (issueKey) {
      return issueKey;
    }
  }

  return null;
}

async function discoverDocumentId(page: Page, orgSlug: string): Promise<string | null> {
  await page
    .goto(`${BASE_URL}/${orgSlug}/documents`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, `/${orgSlug}/documents`, "documents");
  await waitForScreenshotReady(page);

  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      const match = href?.match(/\/documents\/([^/?#]+)/);
      const candidate = match?.[1];
      if (candidate && candidate !== "templates") {
        return candidate;
      }
    }
  } catch {}

  return null;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function autoLogin(page: Page): Promise<string | null> {
  console.log("    Creating test user...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );
  if (!createResult.success) {
    console.error(`    Failed to create user: ${createResult.error}`);
    return null;
  }
  console.log(`    User ready: ${SCREENSHOT_USER.email}`);

  console.log("    Logging in via API...");
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );
  if (!(loginResult.success && loginResult.token)) {
    console.error(`    API login failed: ${loginResult.error}`);
    return null;
  }

  await page.goto(`${BASE_URL}/signin`, { waitUntil: "domcontentloaded" });
  await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForURL((u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname), {
      timeout: 20000,
    });
  } catch {
    console.error("    Login redirect timed out. Current URL:", page.url());
    return null;
  }

  await waitForScreenshotReady(page);
  const orgSlug = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
  console.log(`    Logged in. Org: ${orgSlug}`);
  return orgSlug;
}

// ---------------------------------------------------------------------------
// Screenshot passes
// ---------------------------------------------------------------------------

async function screenshotPublicPages(page: Page): Promise<void> {
  const publicNames = ["landing", "signin", "signup", "forgot-password", "invite-invalid"];
  if (!shouldCaptureAny("public", publicNames)) {
    return;
  }

  console.log("    --- Public pages ---");
  await takeScreenshot(page, "public", "landing", "/");
  await takeScreenshot(page, "public", "signin", "/signin");
  await takeScreenshot(page, "public", "signup", "/signup");
  await takeScreenshot(page, "public", "forgot-password", "/forgot-password");
  await takeScreenshot(page, "public", "invite-invalid", "/invite/screenshot-test-token");
}

async function screenshotEmptyStates(page: Page, orgSlug: string): Promise<void> {
  const emptyNames = [
    "dashboard",
    "projects",
    "issues",
    "documents",
    "documents-templates",
    "workspaces",
    "time-tracking",
    "notifications",
    "my-issues",
    "invoices",
    "clients",
    "settings",
    "settings-profile",
  ];
  if (!shouldCaptureAny("empty", emptyNames)) {
    return;
  }

  console.log("    --- Empty states ---");
  const p = "empty";
  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "notifications", `/${orgSlug}/notifications`);
  await takeScreenshot(page, p, "my-issues", `/${orgSlug}/my-issues`);
  await takeScreenshot(page, p, "invoices", `/${orgSlug}/invoices`);
  await takeScreenshot(page, p, "clients", `/${orgSlug}/clients`);
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);
}

async function screenshotFilledStates(
  page: Page,
  orgSlug: string,
  seed: SeedScreenshotResult,
): Promise<void> {
  console.log("    --- Filled states ---");
  const p = "filled";
  const projectKey = seed.projectKey;
  const normalizedProjectKey = projectKey?.toLowerCase() ?? "";
  const firstIssueKey = seed.issueKeys?.[0];

  // Top-level pages
  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "notifications", `/${orgSlug}/notifications`);
  await takeScreenshot(page, p, "my-issues", `/${orgSlug}/my-issues`);
  await takeScreenshot(page, p, "org-calendar", `/${orgSlug}/calendar`);
  await takeScreenshot(page, p, "org-analytics", `/${orgSlug}/analytics`);
  await takeScreenshot(page, p, "invoices", `/${orgSlug}/invoices`);
  await takeScreenshot(page, p, "clients", `/${orgSlug}/clients`);
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);

  if (
    shouldCaptureAny(p, [
      "dashboard-omnibox",
      "dashboard-advanced-search-modal",
      "dashboard-shortcuts-modal",
      "dashboard-time-entry-modal",
    ])
  ) {
    await screenshotDashboardModals(page, orgSlug, p);
  }
  if (shouldCaptureAny(p, ["projects-create-project-modal"])) {
    await screenshotProjectsModal(page, orgSlug, p);
  }

  // Project sub-pages
  if (projectKey) {
    const tabs = [
      "board",
      "backlog",
      "inbox",
      "sprints",
      "roadmap",
      "calendar",
      "activity",
      "analytics",
      "billing",
      "timesheet",
      "settings",
    ];
    const selectedProjectTabs = tabs.filter((tab) =>
      shouldCapture(p, `project-${normalizedProjectKey}-${tab}`),
    );
    for (const tab of selectedProjectTabs) {
      await takeScreenshot(
        page,
        p,
        `project-${normalizedProjectKey}-${tab}`,
        `/${orgSlug}/projects/${projectKey}/${tab}`,
      );
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-create-issue-modal`,
        `project-${normalizedProjectKey}-issue-detail-modal`,
      ])
    ) {
      await screenshotBoardModals(page, orgSlug, projectKey, firstIssueKey, p);
    }

    // Calendar view modes
    if (
      shouldCaptureAny(p, [
        "calendar-day",
        "calendar-week",
        "calendar-month",
        "calendar-event-modal",
      ])
    ) {
      const calendarUrl = `/${orgSlug}/projects/${projectKey}/calendar`;
      try {
        await page.goto(`${BASE_URL}${calendarUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
      } catch {}
      await waitForScreenshotReady(page);
      const isCalendarReady = await waitForCalendarReady(page);
      if (!isCalendarReady) {
        console.log("    ⚠️  [filled] calendar not ready, skipping mode-specific screenshots");
      } else {
        // Calendar view-mode screenshots: day, week, month
        const calendarModeTestIds = {
          day: TEST_IDS.CALENDAR.MODE_DAY,
          week: TEST_IDS.CALENDAR.MODE_WEEK,
          month: TEST_IDS.CALENDAR.MODE_MONTH,
        } as const;
        for (const mode of ["day", "week", "month"] as const) {
          if (!shouldCapture(p, `calendar-${mode}`)) {
            continue;
          }
          const toggleItem = page.getByTestId(calendarModeTestIds[mode]);
          await toggleItem
            .first()
            .waitFor({ state: "visible", timeout: 5000 })
            .catch(() => {});
          if ((await toggleItem.count()) === 0) {
            throw new Error(`[${p}] calendar-${mode} toggle not found after retries`);
          }
          await toggleItem.first().click();
          await waitForScreenshotReady(page);
          const modeReady = await waitForCalendarReady(page);
          if (!modeReady) {
            throw new Error(`[${p}] calendar-${mode} not ready after mode switch`);
          }
          const n = nextIndex(p);
          const num = String(n).padStart(2, "0");
          const finalPath = getFinalScreenshotPath(p, `calendar-${mode}`);
          const screenshotPath = getStagedScreenshotPath(finalPath);
          await page.screenshot({ path: screenshotPath });
          totalScreenshots++;
          const relativePath = path.relative(process.cwd(), finalPath);
          console.log(`    ${num}  [${p}] calendar-${mode} → ${relativePath}`);
        }

        if (shouldCapture(p, "calendar-event-modal")) {
          await runCaptureStep("calendar event-detail modal", async () => {
            const openDayView = async (): Promise<void> => {
              const dayToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_DAY);
              if ((await dayToggle.count()) > 0) {
                await dayToggle.first().click();
                await waitForScreenshotReady(page);
                await waitForCalendarReady(page);
              }
            };

            const locateEvent = () => page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();

            let eventItem = locateEvent();
            if (typeof seed.workspaceSlug === "string") {
              await page
                .goto(`${BASE_URL}/${orgSlug}/workspaces/${seed.workspaceSlug}/calendar`, {
                  waitUntil: "domcontentloaded",
                  timeout: 15000,
                })
                .catch(() => {});
              await waitForScreenshotReady(page);
              const workspaceCalendarReady = await waitForCalendarReady(page);
              if (workspaceCalendarReady) {
                await openDayView();
                eventItem = locateEvent();
              }
            } else {
              await openDayView();
              eventItem = locateEvent();
            }

            if (!(await waitForCalendarEvents(page))) {
              throw new Error(`[${p}] No calendar events found for modal screenshot`);
            }

            eventItem = locateEvent();
            await eventItem.scrollIntoViewIfNeeded().catch(() => {});
            await eventItem.click({ force: true });
            const dialog = page.getByTestId(TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL);
            await dialog.waitFor({ state: "visible", timeout: 5000 });
            await captureCurrentView(page, p, "calendar-event-modal");
            await dismissIfOpen(page, dialog);
          });
        }
      }
    }
  }

  // Issue detail
  const seededIssueKey = seed.issueKeys?.[0];
  if (seededIssueKey && shouldCapture(p, `issue-${seededIssueKey.toLowerCase()}`)) {
    const firstIssue = (await discoverIssueKey(page, orgSlug, projectKey)) ?? seededIssueKey;
    if (firstIssue) {
      await takeScreenshot(
        page,
        p,
        `issue-${firstIssue.toLowerCase()}`,
        `/${orgSlug}/issues/${firstIssue}`,
      );
    }
  }

  // Workspace & team pages
  const wsSlug = seed.workspaceSlug;
  const teamSlug = seed.teamSlug;

  if (wsSlug) {
    const wsBase = `/${orgSlug}/workspaces/${wsSlug}`;
    const workspaceTargets = [`workspace-${wsSlug}`, `workspace-${wsSlug}-settings`];
    if (shouldCaptureAny(p, workspaceTargets)) {
      await takeScreenshot(page, p, `workspace-${wsSlug}`, wsBase);
      await takeScreenshot(page, p, `workspace-${wsSlug}-settings`, `${wsBase}/settings`);
    }

    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      const teamBase = `${wsBase}/teams/${resolvedTeam}`;
      const teamTargets = [
        `team-${resolvedTeam}`,
        `team-${resolvedTeam}-board`,
        `team-${resolvedTeam}-calendar`,
        `team-${resolvedTeam}-settings`,
      ];
      if (shouldCaptureAny(p, teamTargets)) {
        await takeScreenshot(page, p, `team-${resolvedTeam}`, teamBase);
        for (const tab of ["board", "calendar", "settings"] as const) {
          await takeScreenshot(page, p, `team-${resolvedTeam}-${tab}`, `${teamBase}/${tab}`);
        }
      }
    }
  }

  // Document editor
  if (shouldCapture(p, "document-editor")) {
    const docId = await discoverDocumentId(page, orgSlug);
    if (docId) {
      await takeScreenshot(page, p, "document-editor", `/${orgSlug}/documents/${docId}`);
    }
  }
}

async function screenshotDashboardModals(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (
    !shouldCaptureAny(prefix, [
      "dashboard-omnibox",
      "dashboard-advanced-search-modal",
      "dashboard-shortcuts-modal",
      "dashboard-time-entry-modal",
    ])
  ) {
    return;
  }

  await page
    .goto(`${BASE_URL}/${orgSlug}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, `/${orgSlug}/dashboard`, "dashboard");
  await waitForScreenshotReady(page);

  const omniboxTrigger = page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON);
  const omniboxDialog = page.getByTestId(TEST_IDS.SEARCH.MODAL);
  if ((await omniboxTrigger.count()) > 0) {
    await runCaptureStep("dashboard omnibox", async () => {
      await openOmnibox(page, omniboxTrigger, omniboxDialog);
      await captureCurrentView(page, prefix, "dashboard-omnibox");
      await dismissIfOpen(page, omniboxDialog);
    });

    await runCaptureStep("dashboard advanced-search modal", async () => {
      try {
        await openOmnibox(page, omniboxTrigger, omniboxDialog);
        const advancedSearchButton = omniboxDialog.getByRole("button", {
          name: /^advanced search$/i,
        });
        await advancedSearchButton.waitFor({ state: "visible", timeout: 5000 });
        await advancedSearchButton.click();
        await omniboxDialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
        const advancedSearchDialog = page.getByTestId(TEST_IDS.SEARCH.ADVANCED_MODAL);
        await advancedSearchDialog.waitFor({ state: "visible", timeout: 5000 });
        await captureCurrentView(page, prefix, "dashboard-advanced-search-modal");
        await dismissIfOpen(page, advancedSearchDialog);
      } finally {
        await dismissIfOpen(page, omniboxDialog);
      }
    });
  }

  const shortcutsTrigger = page.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
  if (
    (await shortcutsTrigger.count()) > 0 &&
    (await shortcutsTrigger
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    await runCaptureStep("dashboard shortcuts modal", async () => {
      await dismissAllDialogs(page);
      await shortcutsTrigger.click();
      const shortcutsDialog = page.getByRole("dialog", { name: /keyboard shortcuts/i });
      await shortcutsDialog.waitFor({ state: "visible", timeout: 5000 });
      await captureCurrentView(page, prefix, "dashboard-shortcuts-modal");
      await dismissIfOpen(page, shortcutsDialog);
    });
  }

  const timeEntryTrigger = page.getByRole("button", { name: /^start timer$/i }).first();
  if ((await timeEntryTrigger.count()) > 0) {
    await runCaptureStep("dashboard time-entry modal", async () => {
      await dismissAllDialogs(page);
      await timeEntryTrigger.click();
      const timeEntryDialog = page.getByRole("dialog", { name: /^start timer$/i });
      await timeEntryDialog.waitFor({ state: "visible", timeout: 5000 });
      await captureCurrentView(page, prefix, "dashboard-time-entry-modal");
      await dismissIfOpen(page, timeEntryDialog);
    });
  }
}

async function screenshotProjectsModal(page: Page, orgSlug: string, prefix: string): Promise<void> {
  if (!shouldCapture(prefix, "projects-create-project-modal")) {
    return;
  }

  await page
    .goto(`${BASE_URL}/${orgSlug}/projects`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);

  await runCaptureStep("projects create-project modal", async () => {
    await projectsPage.openCreateProjectForm();
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "projects-create-project-modal");
    await projectsPage.closeCreateProjectFormIfOpen();
  });
}

async function screenshotBoardModals(
  page: Page,
  orgSlug: string,
  projectKey: string,
  issueKey: string | undefined,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const createIssueModalName = `project-${normalizedProjectKey}-create-issue-modal`;
  const issueDetailModalName = `project-${normalizedProjectKey}-issue-detail-modal`;
  if (!shouldCaptureAny(prefix, [createIssueModalName, issueDetailModalName])) {
    return;
  }

  const boardUrl = `/${orgSlug}/projects/${projectKey}/board`;
  await page
    .goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});
  await waitForExpectedContent(page, boardUrl, "board");
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);
  if (
    shouldCapture(prefix, createIssueModalName) &&
    (await projectsPage.createIssueButton.count()) > 0
  ) {
    await runCaptureStep("board create-issue modal", async () => {
      await dismissAllDialogs(page);
      await projectsPage.openCreateIssueModal();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, createIssueModalName);
      await dismissIfOpen(page, projectsPage.createIssueModal);
    });
  }

  let issueCard = page.getByTestId(TEST_IDS.ISSUE.CARD).first();
  if (issueKey) {
    const matchingIssueCard = page
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .filter({ hasText: issueKey })
      .first();
    if ((await matchingIssueCard.count()) > 0) {
      issueCard = matchingIssueCard;
    }
  }

  if (shouldCapture(prefix, issueDetailModalName) && (await issueCard.count()) > 0) {
    await runCaptureStep("board issue-detail modal", async () => {
      await issueCard.scrollIntoViewIfNeeded().catch(() => {});
      await issueCard.click({ force: true });
      const issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
      await issueDetailDialog.waitFor({ state: "visible", timeout: 5000 });
      // Wait for issue content to hydrate - issue key pattern indicates content is loaded
      await issueDetailDialog
        .getByText(/[A-Z][A-Z0-9]+-\d+/)
        .first()
        .waitFor({ timeout: 5000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, issueDetailModalName);
      await dismissIfOpen(page, issueDetailDialog);
    });
  }
}

// ---------------------------------------------------------------------------
// Main capture function for a single viewport/theme combination
// ---------------------------------------------------------------------------

async function captureForConfig(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  seedResult: SeedScreenshotResult,
): Promise<void> {
  currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height})`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
  });
  const page = await context.newPage();

  // Public pages (no auth needed)
  await screenshotPublicPages(page);

  // Inject auth tokens
  await page.goto(`${BASE_URL}/signin`, { waitUntil: "domcontentloaded" });
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );

  if (loginResult.success && loginResult.token) {
    await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
    await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForURL(
        (u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname),
        { timeout: 15000 },
      );
      await waitForScreenshotReady(page);

      // Empty states (before seed data is visible in this context)
      await screenshotEmptyStates(page, orgSlug);

      // Filled states
      const filledOrgSlug = seedResult.orgSlug ?? orgSlug;
      await screenshotFilledStates(page, filledOrgSlug, seedResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isCrashLikeError(message)) {
        throw error;
      }
      captureFailures++;
      console.log(
        `    ⚠️ Auth or capture failed for ${currentConfigPrefix}, skipping authenticated pages: ${message}`,
      );
    }
  }

  await context.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  cliOptions = parseCliOptions(process.argv.slice(2));
  if (cliOptions.help) {
    printUsage();
    return;
  }

  const specFolders = getGeneratedSpecFolders();
  fs.mkdirSync(SCREENSHOT_STAGING_BASE_DIR, { recursive: true });
  stagingRootDir = fs.mkdtempSync(path.join(SCREENSHOT_STAGING_BASE_DIR, "run-"));
  const selectedConfigs = CONFIGS.filter((config) =>
    isConfigSelected(config.viewport, config.theme),
  );

  if (selectedConfigs.length === 0) {
    throw new Error("No screenshot configs matched the provided --config filter");
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         NIXELO SCREENSHOT CAPTURE                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n  Base URL: ${BASE_URL}`);
  console.log(`  Configs: ${selectedConfigs.map((c) => `${c.viewport}-${c.theme}`).join(", ")}`);
  console.log(`  Spec folders: ${[...new Set(specFolders)].join(", ")}`);
  if (cliOptions.specFilters.length > 0) {
    console.log(`  Spec filter: ${cliOptions.specFilters.join(", ")}`);
  }
  if (cliOptions.matchFilters.length > 0) {
    console.log(`  Match filter: ${cliOptions.matchFilters.join(", ")}`);
  }

  const headless = cliOptions.headless;
  const launchBrowser = () => chromium.launch({ headless });
  const setupBrowser = await launchBrowser();

  // Setup: Create test user and seed data once
  console.log("\n  🔧 Setting up test data...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );
  if (!createResult.success) {
    console.error(`  ❌ Failed to create user: ${createResult.error}`);
    await setupBrowser.close();
    return;
  }
  console.log(`  ✓ User: ${SCREENSHOT_USER.email}`);

  // Get org slug via initial login
  const setupContext = await setupBrowser.newContext({
    viewport: VIEWPORTS.desktop,
    colorScheme: "dark",
    timezoneId: E2E_TIMEZONE,
  });
  const setupPage = await setupContext.newPage();
  const orgSlug = await autoLogin(setupPage);
  await setupContext.close();

  if (!orgSlug) {
    console.error("  ❌ Could not authenticate. Aborting.");
    await setupBrowser.close();
    return;
  }
  await setupBrowser.close();

  // Seed data for filled states
  console.log("  Seeding screenshot data...");
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, { orgSlug });
  if (seedResult.success) {
    console.log(
      `  ✓ Seeded: org=${seedResult.orgSlug ?? orgSlug}, project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}`,
    );
  } else {
    console.log(`  ⚠️ Seed failed: ${seedResult.error} (continuing anyway)`);
  }

  // Capture configured combinations
  for (const config of selectedConfigs) {
    let completed = false;
    for (let attempt = 1; attempt <= 2 && !completed; attempt++) {
      const browser = await launchBrowser();
      try {
        await captureForConfig(browser, config.viewport, config.theme, orgSlug, seedResult);
        completed = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const shouldRetry = attempt < 2 && isCrashLikeError(message);
        console.log(
          `    ⚠️ ${config.viewport}-${config.theme} failed on attempt ${attempt}: ${message}${shouldRetry ? " (retrying)" : ""}`,
        );
        if (!shouldRetry) {
          captureFailures++;
          break;
        }
      } finally {
        await browser.close();
      }
    }
  }

  if (captureFailures > 0) {
    fs.rmSync(ensureStagingRoot(), { recursive: true, force: true });
    stagingRootDir = "";
    throw new Error(
      `Screenshot capture had ${captureFailures} failure(s); staged output was not promoted`,
    );
  }

  if (totalScreenshots === 0) {
    fs.rmSync(ensureStagingRoot(), { recursive: true, force: true });
    stagingRootDir = "";
    throw new Error("No screenshots matched the provided filters");
  }

  promoteStagedScreenshots();
  const outputSummary = getStagedOutputSummary();
  fs.rmSync(ensureStagingRoot(), { recursive: true, force: true });
  stagingRootDir = "";

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ COMPLETE: ${totalScreenshots} screenshots captured`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("  Output:");
  for (const [folder, count] of outputSummary) {
    console.log(`    ${count.toString().padStart(3, " ")}  ${folder}`);
  }
  console.log("");
}

run().catch(console.error);
