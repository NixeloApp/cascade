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
import { type Browser, chromium, expect, type Locator, type Page } from "@playwright/test";
import { ROUTES } from "../convex/shared/routes";
import { TEST_IDS } from "../src/lib/test-ids";
import { E2E_TIMEZONE } from "./constants";
import { ProjectsPage } from "./pages";
import { parseCliOptions, printUsage } from "./screenshot-lib/cli";
import {
  BASE_URL,
  type CaptureTarget,
  type CliOptions,
  CONFIGS,
  DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES,
  FALLBACK_SCREENSHOT_DIR,
  MARKDOWN_IMPORT_PREVIEW,
  MARKDOWN_RICH_CONTENT,
  MODAL_SPECS_BASE_DIR,
  PAGE_TO_SPEC_FOLDER,
  SCREENSHOT_STAGING_BASE_DIR,
  SCREENSHOT_USER,
  SEARCH_SHORTCUT,
  SPECS_BASE_DIR,
  type ThemeName,
  VIEWPORTS,
  type ViewportName,
} from "./screenshot-lib/config";
import { injectAuthTokens } from "./utils/auth-helpers";
import {
  getLocatorAttribute,
  getLocatorCount,
  isLocatorVisible,
  waitForLocatorVisible,
} from "./utils/locator-state";
import { routePattern } from "./utils/routes";
import {
  assertScreenshotHashIsNotLoadingState,
  getScreenshotHash,
} from "./utils/screenshot-hash-guards";
import {
  type E2EWorkflowState,
  type SeedScreenshotResult,
  testUserService,
} from "./utils/test-user-service";
import {
  dismissAllDialogs,
  dismissIfOpen,
  waitForAnimation,
  waitForDashboardReady,
  waitForDialogOpen,
  waitForLoadingSkeletonsToClear,
  waitForScreenshotReady,
} from "./utils/wait-helpers";

/**
 * Wait for loading spinners to disappear using data-testid instead of
 * the brittle `role="status"` selector (which also matches alert banners).
 */
async function waitForSpinnersHidden(page: Page, timeout = 5000): Promise<void> {
  try {
    await expect
      .poll(
        async () => {
          const spinner = page.getByTestId(TEST_IDS.LOADING.SPINNER);
          const count = await spinner.count();
          if (count === 0) return 0;
          let visible = 0;
          for (let i = 0; i < count; i++) {
            if (await isLocatorVisible(spinner.nth(i))) visible++;
          }
          return visible;
        },
        { timeout, intervals: [100, 200, 500] },
      )
      .toBe(0);
  } catch {
    // Spinner may have cleared between polls — non-critical
  }
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
  dryRun: false,
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
  // Public pages with suffixes to avoid overwriting base spec screenshots
  [/^public-verify-2fa$/, "02-signin", "-verify-2fa"],
  [/^public-signup-verify$/, "03-signup", "-verify"],
  [/^public-forgot-password-reset$/, "04-forgot-password", "-reset"],
  [/^filled-dashboard-omnibox$/, "04-dashboard", "-omnibox"],
  [/^filled-dashboard-customize-modal$/, "04-dashboard", "-customize-modal"],
  [/^filled-dashboard-advanced-search-modal$/, "04-dashboard", "-advanced-search-modal"],
  [/^filled-dashboard-shortcuts-modal$/, "04-dashboard", "-shortcuts-modal"],
  [/^filled-dashboard-time-entry-modal$/, "04-dashboard", "-time-entry-modal"],
  [/^filled-dashboard-loading-skeletons$/, "04-dashboard", "-loading-skeletons"],
  [/^filled-projects-create-project-modal$/, "05-projects", "-create-project-modal"],
  [/^filled-issues-side-panel$/, "19-issues", "-side-panel"],
  // Workspace modals
  [/^filled-workspaces-create-workspace-modal$/, "27-workspaces", "-create-workspace-modal"],
  [/^filled-workspace-create-team-modal$/, "28-workspace-detail", "-create-team-modal"],
  [/^filled-time-tracking-manual-entry-modal$/, "22-time-tracking", "-manual-entry-modal"],
  [/^filled-settings-profile-avatar-upload-modal$/, "12-settings", "-profile-avatar-upload-modal"],
  [/^filled-settings-profile-cover-upload-modal$/, "12-settings", "-profile-cover-upload-modal"],
  [/^filled-settings-integrations$/, "12-settings", "-integrations"],
  [/^filled-settings-admin$/, "12-settings", "-admin"],
  [/^filled-settings-notifications$/, "12-settings", "-notifications"],
  [/^filled-settings-security$/, "12-settings", "-security"],
  [/^filled-settings-apikeys$/, "12-settings", "-api-keys"],
  [/^filled-settings-preferences$/, "12-settings", "-preferences"],
  [/^filled-settings-offline$/, "12-settings", "-offline"],
  [
    /^filled-settings-notifications-permission-denied$/,
    "12-settings",
    "-notifications-permission-denied",
  ],
  [/^filled-notification-popover$/, "21-notifications", "-popover"],
  [/^filled-notification-snooze-popover$/, "21-notifications", "-snooze-popover"],
  [/^filled-notifications-archived$/, "21-notifications", "-archived"],
  [/^filled-notifications-filter-active$/, "21-notifications", "-filter-active"],
  [/^filled-meetings-detail$/, "30-meetings", "-detail"],
  [/^filled-meetings-transcript-search$/, "30-meetings", "-transcript-search"],
  [/^filled-meetings-memory-lens$/, "30-meetings", "-memory-lens"],
  [/^filled-project-tree$/, "29-team-detail", "-project-tree"],
  [/^filled-mobile-hamburger$/, "04-dashboard", "-mobile-hamburger"],
  // Project board: filled-project-xxx-board → 06-board
  [/^filled-project-.+-board$/, "06-board", ""],
  [/^filled-project-.+-create-issue-modal$/, "06-board", "-create-issue-modal"],
  [
    /^filled-project-.+-create-issue-draft-restoration$/,
    "06-board",
    "-create-issue-draft-restoration",
  ],
  // Project backlog: filled-project-xxx-backlog → 07-backlog
  [/^filled-project-.+-backlog$/, "07-backlog", ""],
  // Project sprints: filled-project-xxx-sprints → 18-sprints
  [/^filled-project-.+-sprints$/, "18-sprints", ""],
  [/^filled-project-.+-sprints-burndown$/, "18-sprints", "-burndown"],
  [/^filled-project-.+-sprints-burnup$/, "18-sprints", "-burnup"],
  [/^filled-project-.+-sprints-completion-modal$/, "18-sprints", "-completion-modal"],
  [/^filled-project-.+-sprints-date-overlap-warning$/, "18-sprints", "-date-overlap-warning"],
  [/^filled-project-.+-sprints-workload$/, "18-sprints", "-workload"],
  // Issue detail: filled-issue-xxx → 08-issue
  [/^filled-issue-/, "08-issue", ""],
  [/^filled-project-.+-issue-detail-modal$/, "08-issue", "-detail-modal"],
  [
    /^filled-project-.+-issue-detail-modal-inline-editing$/,
    "08-issue",
    "-detail-modal-inline-editing",
  ],
  [/^filled-project-.+-import-export-modal$/, "06-board", "-import-export-modal"],
  [/^filled-project-.+-import-export-modal-import$/, "06-board", "-import-export-modal-import"],
  // Board interactive states
  [/^filled-project-.+-board-swimlane-(\w+)$/, "06-board", "-swimlane-$1"],
  [/^filled-project-.+-board-column-collapsed$/, "06-board", "-column-collapsed"],
  [/^filled-project-.+-board-empty-column$/, "06-board", "-empty-column"],
  [/^filled-project-.+-board-wip-limit-warning$/, "06-board", "-wip-limit-warning"],
  [/^filled-project-.+-board-filter-active$/, "06-board", "-filter-active"],
  [/^filled-project-.+-board-display-properties$/, "06-board", "-display-properties"],
  [/^filled-project-.+-board-peek-mode$/, "06-board", "-peek-mode"],
  [/^filled-project-.+-board-sprint-selector$/, "06-board", "-sprint-selector"],
  [
    /^filled-project-.+-create-issue-duplicate-detection$/,
    "06-board",
    "-create-issue-duplicate-detection",
  ],
  [/^filled-project-.+-create-issue-create-another$/, "06-board", "-create-issue-create-another"],
  [/^filled-project-.+-create-issue-validation$/, "06-board", "-create-issue-validation"],
  [/^filled-project-.+-create-issue-success-toast$/, "06-board", "-create-issue-success-toast"],
  // Document editor: filled-document-editor → 10-editor
  [/^filled-document-editor$/, "10-editor", ""],
  [/^filled-document-editor-move-dialog$/, "10-editor", "-move-dialog"],
  [/^filled-document-editor-markdown-preview-modal$/, "10-editor", "-markdown-preview-modal"],
  [/^filled-document-editor-favorite$/, "10-editor", "-favorite"],
  [/^filled-document-editor-sidebar-favorites$/, "10-editor", "-sidebar-favorites"],
  [/^filled-document-editor-locked$/, "10-editor", "-locked"],
  [/^filled-document-editor-rich-blocks$/, "10-editor", "-rich-blocks"],
  [/^filled-document-editor-color-picker$/, "10-editor", "-color-picker"],
  [/^filled-document-editor-slash-menu$/, "10-editor", "-slash-menu"],
  [/^filled-document-editor-floating-toolbar$/, "10-editor", "-floating-toolbar"],
  [/^filled-document-editor-mention-popover$/, "10-editor", "-mention-popover"],
  // Project calendar views: filled-project-xxx-calendar, filled-calendar-{mode}
  [/^filled-project-.+-calendar$/, "11-calendar", ""],
  [/^filled-calendar-(day|week|month)$/, "11-calendar", "-$1"],
  [/^filled-calendar-event-modal$/, "11-calendar", "-event-modal"],
  [/^filled-calendar-create-event-modal$/, "11-calendar", "-create-event-modal"],
  [/^filled-calendar-drag-and-drop$/, "11-calendar", "-drag-and-drop"],
  [/^filled-calendar-quick-add$/, "11-calendar", "-quick-add"],
  // Project analytics: filled-project-xxx-analytics → 13-analytics
  [/^filled-project-.+-analytics$/, "13-analytics", ""],
  // Project members: filled-project-xxx-members → 17-members
  [/^filled-project-.+-members$/, "17-members", ""],
  [/^filled-project-.+-members-confirm-dialog$/, "17-members", "-confirm-dialog"],
  // Project settings: filled-project-xxx-settings → 12-settings
  [
    /^filled-project-.+-settings-delete-alert-dialog$/,
    "12-settings",
    "-project-delete-alert-dialog",
  ],
  [/^filled-project-.+-settings$/, "12-settings", "-project"],
  // Workspace pages: filled-workspace-xxx-{tab} → 28-workspace-detail (specific patterns first)
  [/^filled-workspace-.+-backlog$/, "28-workspace-detail", "-backlog"],
  [/^filled-workspace-.+-calendar$/, "28-workspace-detail", "-calendar"],
  [/^filled-workspace-.+-sprints$/, "28-workspace-detail", "-sprints"],
  [/^filled-workspace-.+-dependencies$/, "28-workspace-detail", "-dependencies"],
  [/^filled-workspace-.+-wiki$/, "28-workspace-detail", "-wiki"],
  [/^filled-workspace-.+-settings$/, "28-workspace-detail", "-settings"],
  // Bare workspace detail (catch-all, must come after suffixed patterns)
  [/^filled-workspace-.+$/, "28-workspace-detail", ""],
  // Team pages: filled-team-xxx-{tab} → 29-team-detail (specific patterns first)
  [/^filled-team-.+-board$/, "29-team-detail", "-board"],
  [/^filled-team-.+-calendar$/, "29-team-detail", "-calendar"],
  [/^filled-team-.+-wiki$/, "29-team-detail", "-wiki"],
  [/^filled-team-.+-settings$/, "29-team-detail", "-settings"],
  // Bare team (catch-all, must come after suffixed patterns)
  [/^filled-team-.+$/, "29-team-detail", ""],
  // Project roadmap: filled-project-xxx-roadmap → 35-roadmap
  [/^filled-project-.+-roadmap$/, "35-roadmap", ""],
  [/^filled-project-.+-roadmap-timeline-selector$/, "35-roadmap", "-timeline-selector"],
  // Project activity: filled-project-xxx-activity → 36-activity
  [/^filled-project-.+-activity$/, "36-activity", ""],
  // Project billing: filled-project-xxx-billing → 37-billing
  [/^filled-project-.+-billing$/, "37-billing", ""],
  // Project timesheet: filled-project-xxx-timesheet → 38-timesheet
  [/^filled-project-.+-timesheet$/, "38-timesheet", ""],
  // Project inbox: filled-project-xxx-inbox → 39-project-inbox
  [/^filled-project-.+-inbox$/, "39-project-inbox", ""],
];

const MODAL_SPEC_PATTERNS: Array<[RegExp, string]> = [
  [/^filled-settings-profile-avatar-upload-modal$/, "avatar-upload"],
  [/^filled-settings-profile-cover-upload-modal$/, "cover-image-upload"],
  [/^filled-project-.+-settings-delete-alert-dialog$/, "alert-dialog"],
  [/^filled-dashboard-omnibox$/, "command-palette"],
  [/^filled-project-.+-members-confirm-dialog$/, "confirm-dialog"],
  [/^filled-dashboard-customize-modal$/, "dashboard-customize"],
  [/^filled-document-editor-move-dialog$/, "move-document"],
  [/^filled-document-editor-markdown-preview-modal$/, "markdown-preview"],
  [/^filled-project-.+-create-issue-modal$/, "create-issue"],
  [/^filled-calendar-create-event-modal$/, "create-event"],
];

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

  let modalSpecSlug: string | null = null;
  for (const [pattern, slug] of MODAL_SPEC_PATTERNS) {
    if (pattern.test(pageId)) {
      modalSpecSlug = slug;
      break;
    }
  }

  return { pageId, specFolder, filenameSuffix, modalSpecSlug };
}

function matchesSpecFilters(target: CaptureTarget): boolean {
  if (cliOptions.specFilters.length === 0) {
    return true;
  }

  const candidates = [
    target.specFolder?.toLowerCase(),
    target.modalSpecSlug?.toLowerCase(),
    target.modalSpecSlug ? "modals" : null,
    target.modalSpecSlug ? `modals/${target.modalSpecSlug.toLowerCase()}` : null,
  ].filter((value): value is string => typeof value === "string");

  return cliOptions.specFilters.some((filter) =>
    candidates.some((candidate) => candidate.includes(filter)),
  );
}

function matchesMatchFilters(prefix: string, name: string, target: CaptureTarget): boolean {
  if (cliOptions.matchFilters.length === 0) {
    return true;
  }

  const haystacks = [
    prefix,
    name,
    target.pageId,
    target.specFolder ?? "",
    target.modalSpecSlug ?? "",
  ].map((value) => value.toLowerCase());

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
  return matchesSpecFilters(target) && matchesMatchFilters(prefix, name, target);
}

function shouldCaptureAny(prefix: string, names: string[]): boolean {
  return names.some((name) => shouldCapture(prefix, name));
}

function getCurrentConfigUnsubscribeToken(seed: SeedScreenshotResult): string | undefined {
  switch (currentConfigPrefix) {
    case "desktop-dark":
      return seed.unsubscribeTokens?.desktopDark;
    case "desktop-light":
      return seed.unsubscribeTokens?.desktopLight;
    case "tablet-light":
      return seed.unsubscribeTokens?.tabletLight;
    case "mobile-light":
      return seed.unsubscribeTokens?.mobileLight;
    default:
      return undefined;
  }
}

function getFinalScreenshotPaths(prefix: string, name: string): string[] {
  const target = resolveCaptureTarget(prefix, name);
  const finalPaths: string[] = [];

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
    finalPaths.push(path.join(specScreenshotDir, filename));
  } else {
    // No spec folder - use fallback with full naming
    const fallbackFilename = `${currentConfigPrefix}-${prefix}-${name}.png`;
    if (!fs.existsSync(FALLBACK_SCREENSHOT_DIR)) {
      fs.mkdirSync(FALLBACK_SCREENSHOT_DIR, { recursive: true });
    }
    finalPaths.push(path.join(FALLBACK_SCREENSHOT_DIR, fallbackFilename));
  }

  if (target.modalSpecSlug) {
    if (!fs.existsSync(MODAL_SPECS_BASE_DIR)) {
      fs.mkdirSync(MODAL_SPECS_BASE_DIR, { recursive: true });
    }
    finalPaths.push(
      path.join(MODAL_SPECS_BASE_DIR, `${target.modalSpecSlug}-${currentConfigPrefix}.png`),
    );
  }

  return [...new Set(finalPaths)];
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
  const modalSpecsPrefix = path.join("docs", "design", "specs", "modals", "screenshots") + path.sep;
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
    } else if (relativePath.startsWith(modalSpecsPrefix)) {
      bucket = "docs/design/specs/modals/screenshots";
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
  const finalPaths = getFinalScreenshotPaths(prefix, name);
  const relativePaths = finalPaths.map((finalPath) => path.relative(process.cwd(), finalPath));
  const relativePathLabel = relativePaths.join(" + ");

  if (cliOptions.dryRun) {
    totalScreenshots++;
    console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}`);
    return;
  }

  const startTime = performance.now();

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch {
    // Navigation timeout is acceptable -- page may still be usable
  }
  await waitForScreenshotReady(page);
  await waitForExpectedContent(page, url, name, prefix);
  await waitForScreenshotReady(page);
  const screenshot = await captureScreenshotBuffer(page);
  const screenshotHash = getScreenshotHash(screenshot);
  assertScreenshotHashIsNotLoadingState(screenshotHash, relativePathLabel);
  for (const finalPath of finalPaths) {
    fs.writeFileSync(getStagedScreenshotPath(finalPath), screenshot);
  }
  totalScreenshots++;

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}  (${elapsed}ms)`);
}

async function captureCurrentView(
  page: Page,
  prefix: string,
  name: string,
  options?: { skipReadyCheck?: boolean },
): Promise<void> {
  if (!shouldCapture(prefix, name)) {
    return;
  }

  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const finalPaths = getFinalScreenshotPaths(prefix, name);
  const relativePaths = finalPaths.map((finalPath) => path.relative(process.cwd(), finalPath));
  const relativePathLabel = relativePaths.join(" + ");

  if (cliOptions.dryRun) {
    totalScreenshots++;
    console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}`);
    return;
  }

  const startTime = performance.now();

  if (!options?.skipReadyCheck) {
    await waitForScreenshotReady(page);
  }
  const screenshot = await captureScreenshotBuffer(page);
  const screenshotHash = getScreenshotHash(screenshot);
  assertScreenshotHashIsNotLoadingState(screenshotHash, relativePathLabel);
  for (const finalPath of finalPaths) {
    fs.writeFileSync(getStagedScreenshotPath(finalPath), screenshot);
  }
  totalScreenshots++;

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}  (${elapsed}ms)`);
}

async function captureScreenshotBuffer(page: Page): Promise<Buffer> {
  return page.screenshot({ animations: "disabled" });
}

let captureSkips = 0;

async function runCaptureStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    // Soft skip — interactive state not available, not a hard failure
    captureSkips++;
    console.log(`    ⚠️  skipped ${label}: ${message}`);
  }
}

async function runRequiredCaptureStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    throw new Error(`Required capture failed for ${label}: ${message}`);
  }
}

async function waitForDuplicateDetectionSearchReady(
  orgSlug: string,
  projectKey: string,
  query: string,
  timeoutMs = 30000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const result = await testUserService.checkProjectIssueDuplicates(
          orgSlug,
          projectKey,
          query,
        );
        return result.success && (result.matchCount ?? 0) > 0;
      },
      {
        timeout: timeoutMs,
        intervals: [1000, 2000, 3000],
        message: `Duplicate search not ready for ${projectKey} in ${orgSlug}`,
      },
    )
    .toBe(true);
}

function isCrashLikeError(message: string): boolean {
  return (
    message.includes("Target crashed") ||
    message.includes("Target page, context or browser has been closed") ||
    message.includes("Page crashed") ||
    message.includes("Browser has been closed")
  );
}

async function openOmnibox(page: Page, trigger: Locator, dialog: Locator): Promise<void> {
  await dismissAllDialogs(page);

  if (await isLocatorVisible(trigger)) {
    await trigger.click();
  } else {
    await page.keyboard.press(SEARCH_SHORTCUT);
  }

  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /search and commands/i }).waitFor({
    state: "visible",
    timeout: 5000,
  });
  await page.getByTestId(TEST_IDS.SEARCH.INPUT).waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
}

async function openStableAlertDialog(
  page: Page,
  trigger: Locator,
  readyLocator: Locator,
  attempts = 3,
): Promise<Locator> {
  let dialog = page.getByRole("alertdialog").first();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await dismissAllDialogs(page);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      dialog = await waitForDialogOpen(page);
      await readyLocator.waitFor({ state: "visible", timeout: 3000 });
      await waitForAnimation(page);
      await readyLocator.waitFor({ state: "visible", timeout: 1000 });
      return dialog;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await dismissAllDialogs(page);
    }
  }

  throw new Error(`Alert dialog did not remain open: ${lastError?.message ?? "unknown error"}`);
}

async function openStableDialog(
  page: Page,
  trigger: Locator,
  dialog: Locator,
  readyLocator: Locator,
  dialogLabel: string,
  attempts = 2,
): Promise<Locator> {
  let lastError: Error | null = null;

  await trigger.waitFor({ state: "visible", timeout: 5000 });

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await dismissAllDialogs(page);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await waitForDialogOpen(page);
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await readyLocator.waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      return dialog;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await dismissAllDialogs(page);
    }
  }

  throw new Error(
    `${dialogLabel} dialog did not become ready: ${lastError?.message ?? "unknown error"}`,
  );
}

function getUploadDialogReadyLocator(dialog: Locator): Locator {
  return dialog.getByRole("button", { name: /^upload$/i });
}

async function waitForDashboardCustomizeDialogReady(page: Page): Promise<Locator> {
  const dialog = page.getByRole("dialog", { name: /dashboard customization/i });
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("Quick Stats", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("Recent Activity", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await dialog
    .getByText("My Workspaces", { exact: true })
    .waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
  return dialog;
}

async function openMobileSidebarMenu(page: Page): Promise<void> {
  const trigger = page.getByRole("button", { name: /toggle sidebar menu/i });
  const sidebar = page.getByTestId(TEST_IDS.NAV.SIDEBAR);
  const closeButton = sidebar.getByLabel("Close sidebar");

  await trigger.waitFor({ state: "visible", timeout: 5000 });
  await trigger.click();
  await closeButton.waitFor({ state: "visible", timeout: 5000 });
  await expect
    .poll(async () => (await getLocatorAttribute(sidebar, "class")) ?? "", {
      timeout: 5000,
      intervals: [100, 200, 500],
    })
    .toContain("translate-x-0");
  await waitForAnimation(page);
}

async function waitForCreateIssueModalScreenshotReady(
  page: Page,
  projectsPage: ProjectsPage,
): Promise<void> {
  await projectsPage.createIssueModal.waitFor({ state: "visible", timeout: 5000 });
  await projectsPage.issueTitleInput.waitFor({ state: "visible", timeout: 5000 });
  await page.getByLabel(/create another/i).waitFor({ state: "visible", timeout: 5000 });
  await waitForAnimation(page);
  await waitForScreenshotReady(page);
}

// Pre-compiled URL patterns derived from ROUTES. Each converts the route path
// (e.g. "/$orgSlug/projects/$key/board") into a regex that matches URLs with
// concrete segments in place of dynamic params.
const URL = {
  projectBoard: routePattern(ROUTES.projects.board.path, "$"),
  projectBacklog: routePattern(ROUTES.projects.backlog.path, "$"),
  projectCalendar: routePattern(ROUTES.projects.calendar.path, "$"),
  projectActivity: routePattern(ROUTES.projects.activity.path, "$"),
  projectAnalytics: routePattern(ROUTES.projects.analytics.path, "$"),
  projectTimesheet: routePattern(ROUTES.projects.timesheet.path, "$"),
  projectSprints: routePattern(ROUTES.projects.sprints.path, "$"),
  projectRoadmap: routePattern(ROUTES.projects.roadmap.path, "$"),
  projectBilling: routePattern(ROUTES.projects.billing.path, "$"),
  projectSettings: routePattern(ROUTES.projects.settings.path, "$"),
  projectInbox: routePattern(ROUTES.projects.inbox.path, "$"),
  dashboard: routePattern(ROUTES.dashboard.path, "$"),
  settings: routePattern(ROUTES.settings.profile.path, "$"),
  projects: routePattern(ROUTES.projects.list.path, "\\/?$"),
  issues: routePattern(ROUTES.issues.list.path, "\\/?$"),
  issueDetail: routePattern(ROUTES.issues.detail.path, "$"),
  workspaces: routePattern(ROUTES.workspaces.list.path, "\\/?$"),
  timeTracking: routePattern(ROUTES.timeTracking.path, "$"),
  notifications: routePattern(ROUTES.notifications.path, "\\/?$"),
  myIssues: routePattern(ROUTES.myIssues.path, "\\/?$"),
  orgCalendar: routePattern(ROUTES.calendar.path, "\\/?$"),
  invoices: routePattern(ROUTES.invoices.list.path, "\\/?$"),
  clients: routePattern(ROUTES.clients.list.path, "\\/?$"),
  meetings: routePattern(ROUTES.meetings.path, "\\/?$"),
  workspaceDetail: routePattern(ROUTES.workspaces.detail.path, "\\/?$"),
  workspaceSettings: routePattern(ROUTES.workspaces.settings.path, "$"),
  workspaceBacklog: routePattern(ROUTES.workspaces.backlog.path, "$"),
  workspaceCalendar: routePattern(ROUTES.workspaces.calendar.path, "$"),
  workspaceSprints: routePattern(ROUTES.workspaces.sprints.path, "$"),
  workspaceDependencies: routePattern(ROUTES.workspaces.dependencies.path, "$"),
  workspaceWiki: routePattern(ROUTES.workspaces.wiki.path, "$"),
  teamDetail: routePattern(ROUTES.workspaces.teams.detail.path, "\\/?$"),
  teamBoard: routePattern(ROUTES.workspaces.teams.board.path, "$"),
  teamCalendar: routePattern(ROUTES.workspaces.teams.calendar.path, "$"),
  teamSettings: routePattern(ROUTES.workspaces.teams.settings.path, "$"),
  teamWiki: routePattern(ROUTES.workspaces.teams.wiki.path, "$"),
  documentEditor: routePattern(ROUTES.documents.detail.path, "$"),
  documentTemplates: routePattern(ROUTES.documents.templates.path, "$"),
};

async function waitForPublicPageReady(page: Page, name: string): Promise<void> {
  if (name === "landing") {
    await page
      .getByRole("heading", { name: /replace scattered project tools/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByText(/product control tower/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (["signin", "signup", "forgot-password"].includes(name)) {
    await page.getByText(/secure account access/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "invite-invalid") {
    await page
      .getByRole("heading", { name: /invalid invitation/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "signup-verify") {
    await page
      .getByRole("heading", { name: /create your account/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByRole("heading", { name: /verify your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "forgot-password-reset") {
    await page
      .getByRole("heading", { name: /check your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "verify-email") {
    await page
      .getByRole("heading", { name: /check your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "invite") {
    await page
      .getByRole("heading", { name: /you're invited/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByText(/has invited you to join/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "unsubscribe") {
    await page
      .getByRole("heading", { name: /unsubscribed/i })
      .or(page.getByRole("heading", { name: /invalid link/i }))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByText(/you've been unsubscribed from email notifications/i)
      .or(page.getByText(/this unsubscribe link is invalid or has expired/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "portal") {
    await page
      .getByRole("heading", { name: /client portal/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByText(/portal token received/i)
      .or(page.getByText(/no projects are available for this portal token/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "portal-project") {
    // The portal-project route currently renders the parent portal entry page
    // (portal.$token.tsx lacks an Outlet for nested routes). Match what actually
    // appears so the screenshot captures the current state.
    await page
      .getByRole("heading", { name: /client portal|project view/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
  }
}

async function waitForCalendarReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK).waitFor({
        state: "visible",
        timeout: 8000,
      });
      await page.getByTestId(TEST_IDS.CALENDAR.ROOT).waitFor({
        state: "visible",
        timeout: 4000,
      });
      await waitForLoadingSkeletonsToClear(page, 4000);
      return true;
    } catch {
      if (attempt === 0) {
        await page.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 });
        await waitForScreenshotReady(page);
      }
    }
  }
  return false;
}

async function waitForCalendarModeSelected(
  page: Page,
  mode: "day" | "week" | "month",
): Promise<void> {
  const toggle = page.getByTestId(getCalendarModeTestId(mode));
  await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 5000 });
  await expect(page.getByTestId(TEST_IDS.CALENDAR.GRID)).toHaveAttribute(
    "data-calendar-view",
    mode,
    {
      timeout: 5000,
    },
  );
}

function getCalendarModeTestId(mode: "day" | "week" | "month"): string {
  switch (mode) {
    case "day":
      return TEST_IDS.CALENDAR.MODE_DAY;
    case "week":
      return TEST_IDS.CALENDAR.MODE_WEEK;
    case "month":
      return TEST_IDS.CALENDAR.MODE_MONTH;
  }
}

async function selectCalendarMode(page: Page, mode: "day" | "week" | "month"): Promise<void> {
  const toggle = page.getByTestId(getCalendarModeTestId(mode));
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await toggle.scrollIntoViewIfNeeded();
      await toggle.click();
      await waitForCalendarModeSelected(page, mode);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      await toggle.evaluate((element) => {
        if (element instanceof HTMLButtonElement) {
          element.click();
        }
      });
      await waitForCalendarModeSelected(page, mode);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `calendar-${mode} mode did not become active: ${lastError?.message ?? "unknown error"}`,
  );
}

async function waitForCalendarEvents(page: Page, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
  const previousButton = page.getByRole("button", { name: /^previous month$/i });
  const nextButton = page.getByRole("button", { name: /^next month$/i });

  const isExpired = () => Date.now() > deadline;
  const hasEvents = async () => (await getLocatorCount(eventItems)) > 0;

  const waitForCalendarState = async () => {
    await waitForScreenshotReady(page);
    await waitForCalendarReady(page);
  };

  const navigateUntilVisible = async (direction: "previous" | "next", steps: number) => {
    const button = direction === "previous" ? previousButton : nextButton;

    for (let step = 0; step < steps; step++) {
      if (isExpired()) return false;
      await button.click();
      await waitForCalendarState();
      if (await hasEvents()) return true;
    }

    return false;
  };

  // Quick check — events already visible?
  if (await hasEvents()) return true;

  // Try clicking "today" button
  await page.getByRole("button", { name: /^today$/i }).click();
  await waitForCalendarState();
  if (await hasEvents()) return true;

  if (isExpired()) return false;

  // Navigate backward then forward looking for events
  if (await navigateUntilVisible("previous", 2)) return true;
  if (isExpired()) return false;
  if (await navigateUntilVisible("next", 4)) return true;

  return false;
}

async function focusCalendarTimedContentForCapture(page: Page): Promise<void> {
  const monthToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_MONTH);
  const monthModeSelected = (await monthToggle.getAttribute("aria-checked")) === "true";
  if (monthModeSelected) {
    return;
  }

  const firstEvent = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();
  if ((await firstEvent.count()) === 0) {
    return;
  }

  await firstEvent.evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }
  });
  await waitForScreenshotReady(page);
}

async function waitForCalendarMonthReady(page: Page): Promise<void> {
  const monthToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_MONTH);
  const waitForMonthToggleSelected = async (timeout: number) => {
    await expect(monthToggle).toHaveAttribute("aria-checked", "true", { timeout });
  };

  await monthToggle.waitFor({ state: "visible", timeout: 5000 });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const isSelected = (await monthToggle.getAttribute("aria-checked")) === "true";
    if (isSelected) {
      break;
    }

    try {
      await monthToggle.scrollIntoViewIfNeeded();
      await monthToggle.click();
      await waitForMonthToggleSelected(1000);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      await monthToggle.evaluate((element) => {
        if (element instanceof HTMLButtonElement) {
          element.click();
        }
      });
      await waitForMonthToggleSelected(1000);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt === 2) {
      throw new Error(
        `Calendar month toggle did not activate: ${lastError?.message ?? "unknown error"}`,
      );
    }
  }

  await waitForMonthToggleSelected(5000);
  await waitForScreenshotReady(page);
  await waitForCalendarReady(page);
  await waitForCalendarMonthGrid(page);
}

function supportsCalendarDragAndDropCapture(configPrefix: string): boolean {
  return configPrefix !== "mobile-light";
}

async function waitForCalendarMonthGrid(
  page: Page,
  options?: { requireQuickAddButtons?: boolean },
): Promise<void> {
  await expect
    .poll(() => page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL).count(), {
      timeout: 5000,
      intervals: [100, 200, 500],
    })
    .toBeGreaterThanOrEqual(28);

  if (options?.requireQuickAddButtons) {
    await expect
      .poll(() => page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY).count(), {
        timeout: 5000,
        intervals: [100, 200, 500],
      })
      .toBeGreaterThanOrEqual(28);
  }
}

async function waitForBoardReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.BOARD.ROOT).waitFor({
        state: "visible",
        timeout: 10000,
      });
      await page.getByTestId(TEST_IDS.BOARD.COLUMN).waitFor({
        state: "visible",
        timeout: 6000,
      });
      await waitForLoadingSkeletonsToClear(page, 4000);
      await waitForSpinnersHidden(page, 4000);
      return true;
    } catch {
      if (attempt === 0) {
        await page.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 });
        await waitForScreenshotReady(page);
      }
    }
  }

  return false;
}

async function waitForProjectsReady(page: Page, prefix?: string): Promise<void> {
  await page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await page.getByRole("button", { name: /create project/i }).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await waitForSpinnersHidden(page);

  if (prefix === "empty") {
    await page.getByTestId(TEST_IDS.PROJECT.EMPTY_STATE).waitFor({
      state: "visible",
      timeout: 12000,
    });
  } else {
    // Wait for at least one project card or the empty state
    await expect
      .poll(
        async () => {
          const cardCount = await page.getByTestId(TEST_IDS.PROJECT.CARD).count();
          return cardCount > 0 ? "ready" : "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }
}

async function waitForIssuesReady(page: Page, prefix?: string): Promise<void> {
  await page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await page.getByRole("button", { name: /create issue/i }).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await expect
    .poll(
      async () => {
        if (prefix === "empty") {
          return (await isLocatorVisible(page.getByText(/no issues found/i))) ? "empty" : "pending";
        }

        const issueCardCount = await getLocatorCount(page.getByTestId(TEST_IDS.ISSUE.CARD));
        if (issueCardCount > 0) {
          return "ready";
        }

        return (await isLocatorVisible(page.getByText(/no issues found/i))) ? "empty" : "pending";
      },
      { timeout: 12000 },
    )
    .not.toBe("pending");
  await waitForSpinnersHidden(page);
}

type CalendarDragState = {
  sourceIndex: number | null;
  targetIndex: number | null;
  dayCellCount: number;
  eventItemCount: number;
};

async function getCalendarDragState(page: Page): Promise<CalendarDragState> {
  const dayCells = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
  const dayCellCount = await getLocatorCount(dayCells);
  const eventItemCount = await getLocatorCount(page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM));

  let sourceIndex: number | null = null;
  for (let index = 0; index < dayCellCount; index += 1) {
    const cellEventCount = await getLocatorCount(
      dayCells.nth(index).getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM),
    );
    if (cellEventCount > 0) {
      sourceIndex = index;
      break;
    }
  }

  if (sourceIndex == null) {
    return {
      sourceIndex: null,
      targetIndex: null,
      dayCellCount,
      eventItemCount,
    };
  }

  const targetIndex = sourceIndex + 1 < dayCellCount ? sourceIndex + 1 : null;
  return {
    sourceIndex,
    targetIndex,
    dayCellCount,
    eventItemCount,
  };
}

async function waitForWorkspacesReady(page: Page, prefix?: string): Promise<void> {
  await page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await page.getByRole("button", { name: /create workspace/i }).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await expect
    .poll(
      async () => {
        if (prefix === "empty") {
          return (await isLocatorVisible(page.getByText(/no workspaces yet/i)))
            ? "ready"
            : "pending";
        }
        const cardCount = await getLocatorCount(page.getByTestId(TEST_IDS.WORKSPACE.CARD));
        return cardCount > 0 ? "ready" : "pending";
      },
      { timeout: 12000 },
    )
    .toBe("ready");
  await waitForSpinnersHidden(page);
}

async function waitForWorkspaceBacklogReady(page: Page): Promise<void> {
  // Wait for actual backlog content - empty state text OR board column (issues present)
  await page
    .getByText(/backlog is empty/i)
    .or(page.getByTestId(TEST_IDS.BOARD.COLUMN))
    .waitFor({ state: "visible", timeout: 12000 });
  await waitForSpinnersHidden(page);
}

async function waitForTeamDetailReady(page: Page): Promise<void> {
  await waitForBoardReady(page);
}

async function waitForIssueDetailReady(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.ISSUE.KEY).first().waitFor({ state: "visible", timeout: 12000 });
  await page
    .getByRole("button", { name: /edit issue|save changes/i })
    .waitFor({ state: "visible", timeout: 12000 });
  await page.getByText("Loading comments...").waitFor({ state: "hidden", timeout: 12000 });
  await page.getByRole("button", { name: /add comment/i }).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await waitForSpinnersHidden(page);
}

async function waitForDocumentsReady(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  // Wait for document cards to render or empty state
  await expect
    .poll(
      async () => {
        const cardCount = await getLocatorCount(page.getByTestId(TEST_IDS.DOCUMENT.CARD));
        if (cardCount > 0) return "ready";
        return (await isLocatorVisible(page.getByText(/no documents/i))) ? "empty" : "pending";
      },
      { timeout: 12000 },
    )
    .not.toBe("pending");
  await waitForSpinnersHidden(page);
}

async function waitForDocumentEditorReady(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.DOCUMENT.TITLE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await page.getByTestId(TEST_IDS.EDITOR.PLATE).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await waitForSpinnersHidden(page);
}

async function waitForAnalyticsReady(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.ANALYTICS.PAGE_HEADER).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await page.getByTestId(TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES).waitFor({
    state: "visible",
    timeout: 12000,
  });
  await waitForSpinnersHidden(page);
  await waitForLoadingSkeletonsToClear(page, 5000);
}

async function scrollSectionNearViewportTop(
  locator: Locator,
  page: Page,
  offset = 24,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const handle = await locator.elementHandle();
  if (!handle) {
    throw new Error("Could not acquire element handle for section scroll alignment");
  }
  const targetScrollTop = await page.evaluate(
    ({ element, topOffset }) => {
      const unclampedTargetTop = element.getBoundingClientRect().top + window.scrollY - topOffset;
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const clampedTargetTop = Math.min(Math.max(0, unclampedTargetTop), maxScrollTop);
      window.scrollTo({ top: clampedTargetTop, behavior: "auto" });
      return clampedTargetTop;
    },
    { element: handle, topOffset: offset },
  );
  await page.waitForFunction(
    (expectedScrollTop) => Math.abs(window.scrollY - expectedScrollTop) <= 2,
    targetScrollTop,
    { timeout: 5000 },
  );
  await waitForAnimation(page);
}

async function waitForRoadmapReady(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE).waitFor({ state: "visible", timeout: 12000 });
  // Wait for timeline canvas or empty state
  await expect
    .poll(
      async () => {
        if (await isLocatorVisible(page.getByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS)))
          return "ready";
        if (await isLocatorVisible(page.getByText(/no issues with target dates/i))) return "empty";
        return "pending";
      },
      { timeout: 12000 },
    )
    .not.toBe("pending");
  await waitForSpinnersHidden(page);
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

  if (URL.dashboard.test(url) || name === "dashboard") {
    // Wait for the sidebar to render — this proves the app shell + auth
    // has completed (splash screen is gone, org context loaded).
    await page
      .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
      .waitFor({ state: "visible", timeout: 30000 });
    // Wait for dashboard heading (confirms route rendered)
    await page
      .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
      .waitFor({ state: "visible", timeout: 15000 });
    // Wait for dashboard shell to render
    await page.getByTestId(TEST_IDS.DASHBOARD.CONTENT).waitFor({
      state: "visible",
      timeout: 20000,
    });
    await waitForSpinnersHidden(page);
    await waitForLoadingSkeletonsToClear(page, 4000);
    return;
  }

  if (URL.projectBoard.test(url) || URL.projectBacklog.test(url)) {
    await waitForBoardReady(page);
    return;
  }

  if (URL.settings.test(url) || name === "settings" || name === "settings-profile") {
    await page.waitForURL(
      (currentUrl) => /\/[^/]+\/settings\/profile$/.test(new URL(currentUrl).pathname),
      {
        timeout: 12000,
      },
    );
    await page
      .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByRole("tab", { name: /^profile$/i })
      .waitFor({ state: "visible", timeout: 12000 });

    if (name === "settings-notifications") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.NOTIFICATION_PREFERENCES_SECTION)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    if (name === "settings-security") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.TWO_FACTOR_SECTION)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    if (name === "settings-apikeys") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.API_KEYS_SECTION)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    if (name === "settings-integrations") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.GITHUB_INTEGRATION)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    if (name === "settings-admin") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    if (name === "settings-offline") {
      await page
        .getByTestId(TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD)
        .waitFor({ state: "visible", timeout: 12000 });
    }

    await waitForSpinnersHidden(page);
    return;
  }

  // --- Pages with unique readiness logic ---

  if (URL.projects.test(url) || name === "projects") {
    await waitForProjectsReady(page, prefix);
    return;
  }

  if (URL.issues.test(url) || name === "issues") {
    await waitForIssuesReady(page, prefix);
    return;
  }

  if (URL.workspaces.test(url) || name === "workspaces") {
    await waitForWorkspacesReady(page, prefix);
    return;
  }

  if (URL.issueDetail.test(url)) {
    await waitForIssueDetailReady(page);
    return;
  }

  if (name === "documents" || /\/[^/]+\/documents\/?$/.test(url)) {
    await waitForDocumentsReady(page);
    return;
  }

  if (URL.documentEditor.test(url) || name === "document-editor") {
    await waitForDocumentEditorReady(page);
    return;
  }

  if (URL.projectAnalytics.test(url) || name === "org-analytics") {
    await waitForAnalyticsReady(page);
    return;
  }

  if (URL.projectRoadmap.test(url)) {
    await waitForRoadmapReady(page);
    return;
  }

  if (URL.notifications.test(url) || name === "notifications") {
    await waitForDashboardReady(page);
    const headerTitle = page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE);
    const inboxTab = page.getByRole("tab", { name: /inbox/i });
    const notificationItems = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM);
    const emptyState = page.getByText(/no notifications/i);
    const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
    await expect
      .poll(
        async () => (await isLocatorVisible(headerTitle)) || (await isLocatorVisible(inboxTab)),
        { timeout: 12000 },
      )
      .toBe(true);
    await waitForSpinnersHidden(page);
    await expect
      .poll(
        async () => {
          const mentionsVisible = await isLocatorVisible(mentionsFilter);
          const itemCount = await getLocatorCount(notificationItems);
          const emptyVisible = await isLocatorVisible(emptyState);
          return mentionsVisible && (itemCount > 0 || emptyVisible) ? "ready" : "pending";
        },
        { timeout: 10000 },
      )
      .toBe("ready");
    return;
  }

  if (URL.meetings.test(url) || name === "meetings") {
    await page
      .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.MEETINGS.MEMORY_SECTION)
      .or(page.getByText(/no meeting recordings yet/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForSpinnersHidden(page);
    return;
  }

  // --- Calendar pages (project, workspace, team, org) ---

  if (
    URL.projectCalendar.test(url) ||
    URL.workspaceCalendar.test(url) ||
    URL.teamCalendar.test(url) ||
    name === "calendar-event-modal" ||
    /^calendar-(day|week|month)$/.test(name)
  ) {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000);
    await focusCalendarTimedContentForCapture(page);
    return;
  }

  if (
    (URL.orgCalendar.test(url) && !url.includes("/projects/") && !url.includes("/workspaces/")) ||
    name === "org-calendar"
  ) {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000);
    return;
  }

  // --- Board pages (project, workspace backlog, team) ---

  if (URL.workspaceBacklog.test(url)) {
    await waitForWorkspaceBacklogReady(page);
    return;
  }

  if (URL.teamDetail.test(url) || URL.teamBoard.test(url) || /^team-[^-]+-board$/.test(name)) {
    await waitForTeamDetailReady(page);
    return;
  }

  // --- Settings sub-tab pages ---

  if (URL.settings.test(url) || name === "settings" || name === "settings-profile") {
    await page.waitForURL(
      (currentUrl) => /\/[^/]+\/settings\/profile$/.test(new URL(currentUrl).pathname),
      { timeout: 12000 },
    );
    await page
      .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByRole("tab", { name: /^profile$/i })
      .waitFor({ state: "visible", timeout: 12000 });

    // Wait for specific sub-tab content when navigated to a settings sub-section
    const settingsSubTabTestIds: Record<string, string> = {
      "settings-notifications": TEST_IDS.SETTINGS.NOTIFICATION_PREFERENCES_SECTION,
      "settings-security": TEST_IDS.SETTINGS.TWO_FACTOR_SECTION,
      "settings-apikeys": TEST_IDS.SETTINGS.API_KEYS_SECTION,
      "settings-integrations": TEST_IDS.SETTINGS.GITHUB_INTEGRATION,
      "settings-admin": TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION,
      "settings-offline": TEST_IDS.SETTINGS.OFFLINE_STATUS_CARD,
    };
    const subTabTestId = settingsSubTabTestIds[name];
    if (subTabTestId) {
      await page.getByTestId(subTabTestId).waitFor({ state: "visible", timeout: 12000 });
    }

    await waitForSpinnersHidden(page);
    return;
  }

  // --- Default fallback: wait for page header + spinners ---
  // Covers: authentication, add-ons, assistant, mcp-server, invoices,
  // clients, my-issues, inbox, time-tracking, workspace detail,
  // workspace settings, workspace sprints, workspace dependencies,
  // workspace wiki, team settings, team wiki, document templates,
  // project activity, project timesheet, project sprints, project
  // billing, project settings, project members
  await page
    .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
    .or(page.getByText(/no .+yet|nothing here yet/i))
    .first()
    .waitFor({ state: "visible", timeout: 12000 });
  await waitForSpinnersHidden(page);
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
    ROUTES.issues.list.build(orgSlug),
    ROUTES.projects.backlog.build(orgSlug, projectKey),
    ROUTES.projects.board.build(orgSlug, projectKey),
  ];

  for (const pathName of candidatePaths) {
    await page.goto(`${BASE_URL}${pathName}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, pathName, "issues");
    await waitForScreenshotReady(page);

    const issueKeyElement = page.getByTestId(TEST_IDS.ISSUE.KEY).first();
    if ((await issueKeyElement.count()) > 0) {
      const issueKeyText = (await issueKeyElement.textContent())?.trim();
      if (issueKeyText) {
        return issueKeyText;
      }
    }

    const issueKey = await discoverFirstHref(page, /\/issues\/([^/?#]+)/);
    if (issueKey) {
      return issueKey;
    }
  }

  return null;
}

async function discoverDocumentId(page: Page, orgSlug: string): Promise<string | null> {
  await page.goto(`${BASE_URL}${ROUTES.documents.list.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await waitForExpectedContent(page, ROUTES.documents.list.build(orgSlug), "documents");
  await waitForScreenshotReady(page);

  const preferredTitles = [/sprint retrospective notes/i, /project requirements/i];
  const mainContent = page.getByRole("main");

  try {
    const links = mainContent.locator("a");
    const count = await links.count();

    for (const preferredTitle of preferredTitles) {
      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute("href");
        const text = (await link.innerText().catch(() => "")).trim();
        const match = href?.match(/\/documents\/([^/?#]+)/);
        const candidate = match?.[1];
        if (candidate && candidate !== "templates" && preferredTitle.test(text)) {
          return candidate;
        }
      }
    }

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

async function openDocumentEditorForCapture(page: Page, docUrl: string): Promise<void> {
  await page.goto(`${BASE_URL}${docUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForExpectedContent(page, docUrl, "document-editor");
  await waitForScreenshotReady(page);
}

async function openDocumentActionsMenu(page: Page): Promise<void> {
  const trigger = page.getByRole("button", { name: /more document actions/i });
  await trigger.waitFor({ state: "visible", timeout: 8000 });
  await trigger.click();
  await page.getByRole("menu").waitFor({ state: "visible", timeout: 5000 });
}

async function openMarkdownImportPreviewDialog(
  page: Page,
  markdown: string,
  filename: string,
): Promise<Locator> {
  await dismissAllDialogs(page);
  const trigger = page.getByRole("button", { name: /import from markdown/i });
  await trigger.waitFor({ state: "visible", timeout: 8000 });
  await page.evaluate(
    ({ queuedMarkdown, queuedFilename }) => {
      window.__NIXELO_E2E_MARKDOWN_IMPORT__ = {
        markdown: queuedMarkdown,
        filename: queuedFilename,
      };
    },
    { queuedMarkdown: markdown, queuedFilename: filename },
  );
  await trigger.evaluate((button: HTMLElement) => {
    button.click();
  });
  const dialog = page.getByRole("dialog", { name: /preview markdown import/i });
  await dialog.waitFor({ state: "visible", timeout: 8000 });
  await waitForAnimation(page);
  return dialog;
}

async function primeDocumentEditorRichContent(page: Page, docUrl: string): Promise<void> {
  await openDocumentEditorForCapture(page, docUrl);
  await page.evaluate((markdown) => {
    window.dispatchEvent(
      new CustomEvent("nixelo:e2e-set-editor-markdown", {
        detail: { markdown },
      }),
    );
  }, MARKDOWN_RICH_CONTENT);
  await page.getByText(/^Release Readiness$/).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/qa signoff/i).waitFor({ state: "visible", timeout: 5000 });
  await page
    .getByText(/export const shipWindow = "2026-03-25";/i)
    .waitFor({ state: "visible", timeout: 5000 });
  await waitForScreenshotReady(page);
}

async function openDocumentEditorSlashMenuForCapture(page: Page, docUrl: string): Promise<void> {
  await openDocumentEditorForCapture(page, docUrl);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("nixelo:e2e-open-slash-menu"));
  });
  await page.locator("[role='option']").first().waitFor({ state: "visible", timeout: 5000 });
  await waitForScreenshotReady(page);
}

async function openDocumentEditorMentionPopoverForCapture(
  page: Page,
  docUrl: string,
): Promise<void> {
  await openDocumentEditorForCapture(page, docUrl);
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("nixelo:e2e-set-editor-value", {
        detail: {
          value: [
            {
              type: "paragraph",
              children: [
                { text: "Follow up with " },
                {
                  type: "mention_input",
                  trigger: "@",
                  children: [{ text: "em" }],
                },
              ],
            },
          ],
        },
      }),
    );
  });
  await page.getByRole("combobox").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("combobox").locator("button").first().waitFor({
    state: "visible",
    timeout: 5000,
  });
  await waitForScreenshotReady(page);
}

async function openDocumentEditorFloatingToolbarForCapture(
  page: Page,
  docUrl: string,
): Promise<void> {
  await openDocumentEditorForCapture(page, docUrl);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("nixelo:e2e-open-floating-toolbar"));
  });
  await page.getByRole("button", { name: /bold/i }).waitFor({
    state: "visible",
    timeout: 5000,
  });
  await waitForScreenshotReady(page);
}

async function clearIssueDrafts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const draftKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cascade_draft_create-issue_")) {
        draftKeys.push(key);
      }
    }
    for (const key of draftKeys) {
      localStorage.removeItem(key);
    }
  });
}

async function seedIssueDraft(page: Page, projectId: string, title: string): Promise<void> {
  await page.evaluate(
    ({ projectId, title }) => {
      localStorage.setItem(
        `cascade_draft_create-issue_${projectId}`,
        JSON.stringify({
          data: {
            title,
            description: "",
            type: "task",
            priority: "medium",
            assigneeId: "",
            storyPoints: "",
            selectedLabels: [],
          },
          timestamp: Date.now(),
        }),
      );
    },
    { projectId, title },
  );
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

  await page.goto(`${BASE_URL}${ROUTES.signin.build()}`, { waitUntil: "domcontentloaded" });
  await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
  await page.goto(`${BASE_URL}${ROUTES.app.build()}`, { waitUntil: "domcontentloaded" });

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

async function screenshotPublicPages(page: Page, seed: SeedScreenshotResult): Promise<void> {
  const publicNames = [
    "landing",
    "signin",
    "signup",
    "signup-verify",
    "forgot-password",
    "forgot-password-reset",
    "verify-email",
    "verify-2fa",
    "invite",
    "invite-invalid",
    "unsubscribe",
    "portal",
    "portal-project",
  ];
  if (!shouldCaptureAny("public", publicNames)) {
    return;
  }

  console.log("    --- Public pages ---");
  await takeScreenshot(page, "public", "landing", ROUTES.home.build());
  await takeScreenshot(page, "public", "signin", ROUTES.signin.build());
  await takeScreenshot(page, "public", "signup", ROUTES.signup.build());
  await takeScreenshot(
    page,
    "public",
    "signup-verify",
    `${ROUTES.signup.build()}?step=verify&email=screenshots%40inbox.mailtrap.io`,
  );
  await takeScreenshot(page, "public", "forgot-password", ROUTES.forgotPassword.build());
  await takeScreenshot(
    page,
    "public",
    "forgot-password-reset",
    `${ROUTES.forgotPassword.build()}?step=reset&email=screenshots%40inbox.mailtrap.io`,
  );
  await takeScreenshot(
    page,
    "public",
    "verify-email",
    ROUTES.verifyEmail.build("screenshots@inbox.mailtrap.io"),
  );
  await takeScreenshot(page, "public", "verify-2fa", ROUTES.verify2FA.build());
  if (seed.inviteToken) {
    await takeScreenshot(page, "public", "invite", ROUTES.invite.build(seed.inviteToken));
  }
  await takeScreenshot(page, "public", "invite-invalid", "/invite/screenshot-test-token");
  const unsubscribeToken = getCurrentConfigUnsubscribeToken(seed);
  if (unsubscribeToken) {
    await takeScreenshot(page, "public", "unsubscribe", ROUTES.unsubscribe.build(unsubscribeToken));
  }

  if (seed.portalToken) {
    await takeScreenshot(page, "public", "portal", ROUTES.portal.entry.build(seed.portalToken));
    if (seed.portalProjectId) {
      await takeScreenshot(
        page,
        "public",
        "portal-project",
        ROUTES.portal.project.build(seed.portalToken, seed.portalProjectId),
      );
    }
  }
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
    "meetings",
    "settings",
    "settings-profile",
  ];
  if (!shouldCaptureAny("empty", emptyNames)) {
    return;
  }

  console.log("    --- Empty states ---");
  const p = "empty";
  await takeScreenshot(page, p, "dashboard", ROUTES.dashboard.build(orgSlug));
  await takeScreenshot(page, p, "projects", ROUTES.projects.list.build(orgSlug));
  await takeScreenshot(page, p, "issues", ROUTES.issues.list.build(orgSlug));
  await takeScreenshot(page, p, "documents", ROUTES.documents.list.build(orgSlug));
  await takeScreenshot(page, p, "documents-templates", ROUTES.documents.templates.build(orgSlug));
  await takeScreenshot(page, p, "workspaces", ROUTES.workspaces.list.build(orgSlug));
  await takeScreenshot(page, p, "time-tracking", ROUTES.timeTracking.build(orgSlug));
  await takeScreenshot(page, p, "notifications", ROUTES.notifications.build(orgSlug));
  await takeScreenshot(page, p, "my-issues", ROUTES.myIssues.build(orgSlug));
  await takeScreenshot(page, p, "invoices", ROUTES.invoices.list.build(orgSlug));
  await takeScreenshot(page, p, "clients", ROUTES.clients.list.build(orgSlug));
  await takeScreenshot(page, p, "meetings", ROUTES.meetings.build(orgSlug));
  await takeScreenshot(page, p, "settings", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(page, p, "settings-profile", ROUTES.settings.profile.build(orgSlug));
}

async function screenshotFilledStates(
  page: Page,
  orgSlug: string,
  seed: SeedScreenshotResult,
): Promise<void> {
  console.log("    --- Filled states ---");
  const p = "filled";
  const projectKey = seed.projectKey;
  const projectId = seed.projectId;
  const normalizedProjectKey = projectKey?.toLowerCase() ?? "";
  const firstIssueKey = seed.issueKeys?.[0];

  // Top-level pages
  await takeScreenshot(page, p, "dashboard", ROUTES.dashboard.build(orgSlug));
  await takeScreenshot(page, p, "projects", ROUTES.projects.list.build(orgSlug));
  await takeScreenshot(page, p, "issues", ROUTES.issues.list.build(orgSlug));
  await takeScreenshot(page, p, "documents", ROUTES.documents.list.build(orgSlug));
  await takeScreenshot(page, p, "documents-templates", ROUTES.documents.templates.build(orgSlug));
  await takeScreenshot(page, p, "workspaces", ROUTES.workspaces.list.build(orgSlug));
  await takeScreenshot(page, p, "time-tracking", ROUTES.timeTracking.build(orgSlug));
  await takeScreenshot(page, p, "notifications", ROUTES.notifications.build(orgSlug));
  await takeScreenshot(page, p, "my-issues", ROUTES.myIssues.build(orgSlug));
  await takeScreenshot(page, p, "org-calendar", ROUTES.calendar.build(orgSlug));
  await takeScreenshot(page, p, "org-analytics", ROUTES.analytics.build(orgSlug));
  await takeScreenshot(page, p, "invoices", ROUTES.invoices.list.build(orgSlug));
  await takeScreenshot(page, p, "clients", ROUTES.clients.list.build(orgSlug));
  await takeScreenshot(page, p, "meetings", ROUTES.meetings.build(orgSlug));
  await takeScreenshot(page, p, "settings", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(page, p, "settings-profile", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(
    page,
    p,
    "settings-integrations",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=integrations`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-admin",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=admin`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-notifications",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=notifications`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-security",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=security`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-apikeys",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=apikeys`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-preferences",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=preferences`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-offline",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=offline`,
  );
  await takeScreenshot(page, p, "authentication", ROUTES.authentication.build(orgSlug));
  await takeScreenshot(page, p, "add-ons", ROUTES.addOns.build(orgSlug));
  await takeScreenshot(page, p, "assistant", ROUTES.assistant.build(orgSlug));
  await takeScreenshot(page, p, "mcp-server", ROUTES.mcp.build(orgSlug));

  if (
    shouldCaptureAny(p, [
      "dashboard-omnibox",
      "dashboard-advanced-search-modal",
      "dashboard-shortcuts-modal",
      "dashboard-time-entry-modal",
      "dashboard-loading-skeletons",
    ])
  ) {
    await screenshotDashboardModals(page, orgSlug, p);
    await screenshotDashboardLoadingState(page, orgSlug, p);
  }
  if (shouldCaptureAny(p, ["projects-create-project-modal"])) {
    await screenshotProjectsModal(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, ["meetings-detail", "meetings-transcript-search", "meetings-memory-lens"])
  ) {
    await screenshotMeetingsStates(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, [
      "settings-profile-avatar-upload-modal",
      "settings-profile-cover-upload-modal",
      "settings-notifications-permission-denied",
    ])
  ) {
    const settingsUrl = ROUTES.settings.profile.build(orgSlug);

    if (shouldCapture(p, "settings-profile-avatar-upload-modal")) {
      await runCaptureStep("settings profile avatar upload modal", async () => {
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, "settings-profile", p);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^change avatar$/i });
        const dialog = await openStableDialog(
          page,
          trigger,
          page.getByRole("dialog", { name: /^upload avatar$/i }),
          getUploadDialogReadyLocator(page.getByRole("dialog", { name: /^upload avatar$/i })),
          "avatar upload",
        );
        await captureCurrentView(page, p, "settings-profile-avatar-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-profile-cover-upload-modal")) {
      await runCaptureStep("settings profile cover upload modal", async () => {
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, "settings-profile", p);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^(add|change) cover$/i });
        const dialog = await openStableDialog(
          page,
          trigger,
          page.getByRole("dialog", { name: /^upload cover image$/i }),
          getUploadDialogReadyLocator(page.getByRole("dialog", { name: /^upload cover image$/i })),
          "cover image upload",
        );
        await captureCurrentView(page, p, "settings-profile-cover-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-notifications-permission-denied")) {
      await runCaptureStep("settings notifications permission denied", async () => {
        const permissionPage = await page.context().newPage();
        try {
          await permissionPage.addInitScript(() => {
            window.__NIXELO_E2E_NOTIFICATION_PERMISSION__ = "denied";
            window.__NIXELO_E2E_WEB_PUSH_SUPPORTED__ = true;
            window.__NIXELO_E2E_VAPID_PUBLIC_KEY__ = "e2e-screenshot-vapid-key";
          });

          const notificationsSettingsUrl = `${settingsUrl}?tab=notifications`;
          await permissionPage.goto(`${BASE_URL}${notificationsSettingsUrl}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await waitForExpectedContent(permissionPage, settingsUrl, "settings-profile", p);
          await permissionPage
            .getByText(/browser notifications blocked/i)
            .waitFor({ state: "visible", timeout: 5000 });
          await permissionPage
            .getByRole("button", { name: /^blocked$/i })
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(permissionPage);
          await captureCurrentView(permissionPage, p, "settings-notifications-permission-denied");
        } finally {
          if (!permissionPage.isClosed()) {
            await permissionPage.close();
          }
        }
      });
    }
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
        `project-${normalizedProjectKey}-members`,
        `project-${normalizedProjectKey}-members-confirm-dialog`,
      ])
    ) {
      await runCaptureStep("project members", async () => {
        const settingsUrl = `/${orgSlug}/projects/${projectKey}/settings`;
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-members`);
        const membersHeading = page.getByRole("heading", { name: /^members$/i });
        await scrollSectionNearViewportTop(membersHeading, page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-members`);

        if (shouldCapture(p, `project-${normalizedProjectKey}-members-confirm-dialog`)) {
          const removeButton = page.getByRole("button", { name: /^remove$/i }).first();
          const dialog = await openStableDialog(
            page,
            removeButton,
            page.getByRole("alertdialog", { name: /^remove member$/i }),
            page
              .getByRole("alertdialog", { name: /^remove member$/i })
              .getByText(/lose access to all project resources\./i),
            "remove member",
          );
          await captureCurrentView(
            page,
            p,
            `project-${normalizedProjectKey}-members-confirm-dialog`,
          );
          await dismissIfOpen(page, dialog);
        }
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-settings-delete-alert-dialog`)) {
      await runCaptureStep("project settings delete alert dialog", async () => {
        const settingsUrl = `/${orgSlug}/projects/${projectKey}/settings`;
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-settings`);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^delete project$/i });
        const confirmInput = page.getByPlaceholder(`Type ${projectKey} to confirm`);
        await trigger.waitFor({ state: "visible", timeout: 8000 });
        const dialog = await openStableAlertDialog(page, trigger, confirmInput);
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-settings-delete-alert-dialog`,
        );
        await dismissIfOpen(page, dialog);
      });
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-create-issue-modal`,
        `project-${normalizedProjectKey}-issue-detail-modal`,
        `project-${normalizedProjectKey}-issue-detail-modal-inline-editing`,
      ])
    ) {
      await screenshotBoardModals(page, orgSlug, projectKey, firstIssueKey, p);
    }

    // Create issue — "create another" toggle
    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-create-another`)) {
      await runCaptureStep("create issue create-another toggle", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        // Toggle "Create another" switch
        const toggle = page.getByLabel(/create another/i);
        await toggle.waitFor({ state: "visible", timeout: 5000 });
        await toggle.click();
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-create-another`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    // Create issue — form validation errors (submit with empty title)
    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-validation`)) {
      await runCaptureStep("create issue validation errors", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        // Wait for dialog, then find submit button
        const modal = await waitForDialogOpen(page);
        const submitBtn = modal.getByRole("button", { name: /create issue/i }).last();
        await submitBtn.click();
        await waitForScreenshotReady(page);
        // Wait for validation error text to appear
        await page
          .getByText(/required|title is required|cannot be empty/i)
          .first()
          .waitFor({ state: "visible", timeout: 3000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-validation`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-success-toast`)) {
      await runCaptureStep("create issue success toast", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const issueTitle = "Screenshot toast issue";
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        const modal = await waitForDialogOpen(page);
        const titleInput = modal
          .getByPlaceholder(/title|issue.*title/i)
          .or(modal.getByRole("textbox", { name: /title/i }))
          .first();
        const submitButton = modal.getByRole("button", { name: /^create issue$/i }).last();
        await titleInput.fill(issueTitle);
        await submitButton.click();
        await modal.waitFor({ state: "hidden", timeout: 8000 });
        const successToast = page
          .getByTestId(TEST_IDS.TOAST.SUCCESS)
          .filter({ hasText: /issue created successfully/i })
          .first();
        await successToast.waitFor({ state: "visible", timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-success-toast`,
        );
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-duplicate-detection`)) {
      await runCaptureStep("create issue duplicate detection", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const duplicateQuery = "login timeout";
        await waitForDuplicateDetectionSearchReady(orgSlug, projectKey, duplicateQuery);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        await projectsPage.issueTitleInput.fill(duplicateQuery);
        const duplicateBanner = page.getByText("Potential duplicates found", { exact: true });
        await duplicateBanner.waitFor({ state: "visible", timeout: 20000 });
        await page
          .getByRole("button", { name: /DEMO-2.*fix login timeout on mobile/i })
          .waitFor({ state: "visible", timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-duplicate-detection`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-draft-restoration`)) {
      await runCaptureStep("create issue draft restoration", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const draftTitle = "Restore saved launch checklist";
        if (!projectId) {
          throw new Error("Screenshot seed did not return projectId");
        }

        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        await clearIssueDrafts(page);
        await seedIssueDraft(page, projectId, draftTitle);

        const projectsPage = new ProjectsPage(page, orgSlug);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        await page
          .getByText(/you have an unsaved draft/i)
          .waitFor({ state: "visible", timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-draft-restoration`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
        await clearIssueDrafts(page);
      });
    }

    // Sprint selector dropdown (on board)
    if (shouldCapture(p, `project-${normalizedProjectKey}-board-sprint-selector`)) {
      await runCaptureStep("board sprint selector", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const sprintSelect = page
          .getByRole("combobox")
          .filter({ hasText: /sprint|active/i })
          .first();
        await sprintSelect.waitFor({ state: "visible", timeout: 25000 });
        await sprintSelect.click();
        // Wait for dropdown options
        await page.getByRole("option").first().waitFor({ state: "visible", timeout: 3000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-board-sprint-selector`);
        await page.keyboard.press("Escape");
      });
    }

    // Board interactive states
    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-board-swimlane-priority`,
        `project-${normalizedProjectKey}-board-swimlane-assignee`,
        `project-${normalizedProjectKey}-board-swimlane-type`,
        `project-${normalizedProjectKey}-board-swimlane-label`,
        `project-${normalizedProjectKey}-board-column-collapsed`,
        `project-${normalizedProjectKey}-board-empty-column`,
        `project-${normalizedProjectKey}-board-wip-limit-warning`,
        `project-${normalizedProjectKey}-board-filter-active`,
        `project-${normalizedProjectKey}-board-display-properties`,
        `project-${normalizedProjectKey}-board-peek-mode`,
      ])
    ) {
      await screenshotBoardInteractiveStates(page, orgSlug, projectKey, p);
    }

    // Sprint interactive states
    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-sprints-burndown`,
        `project-${normalizedProjectKey}-sprints-burnup`,
        `project-${normalizedProjectKey}-sprints-completion-modal`,
        `project-${normalizedProjectKey}-sprints-date-overlap-warning`,
        `project-${normalizedProjectKey}-sprints-workload`,
      ])
    ) {
      await screenshotSprintInteractiveStates(page, orgSlug, projectKey, p);
    }

    if (shouldCaptureAny(p, ["issues-side-panel"])) {
      await screenshotIssueInteractiveStates(page, orgSlug, p);
    }

    // Calendar view modes
    if (
      shouldCaptureAny(p, [
        "calendar-day",
        "calendar-week",
        "calendar-month",
        "calendar-event-modal",
        "calendar-drag-and-drop",
        "calendar-quick-add",
      ])
    ) {
      const calendarUrl = ROUTES.projects.calendar.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${calendarUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
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
          await toggleItem.waitFor({ state: "visible", timeout: 5000 });
          if ((await toggleItem.count()) === 0) {
            throw new Error(`[${p}] calendar-${mode} toggle not found after retries`);
          }
          await selectCalendarMode(page, mode);
          await waitForScreenshotReady(page);
          const modeReady = await waitForCalendarReady(page);
          if (!modeReady) {
            throw new Error(`[${p}] calendar-${mode} not ready after mode switch`);
          }
          await focusCalendarTimedContentForCapture(page);
          await captureCurrentView(page, p, `calendar-${mode}`);
        }

        if (shouldCapture(p, "calendar-event-modal")) {
          await runCaptureStep("calendar event-detail modal", async () => {
            const openDayView = async (): Promise<void> => {
              const dayToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_DAY);
              if ((await dayToggle.count()) > 0) {
                await dayToggle.click();
                await waitForScreenshotReady(page);
                await waitForCalendarReady(page);
              }
            };

            const locateEvent = () => page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();

            let eventItem = locateEvent();
            if (typeof seed.workspaceSlug === "string") {
              await page.goto(
                `${BASE_URL}${ROUTES.workspaces.calendar.build(orgSlug, seed.workspaceSlug)}`,
                {
                  waitUntil: "domcontentloaded",
                  timeout: 15000,
                },
              );
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
            await eventItem.scrollIntoViewIfNeeded();
            await eventItem.click();
            const dialog = page.getByTestId(TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL);
            await dialog.waitFor({ state: "visible", timeout: 5000 });
            await captureCurrentView(page, p, "calendar-event-modal");
            await dismissIfOpen(page, dialog);
          });
        }

        if (shouldCapture(p, "calendar-quick-add")) {
          await runCaptureStep("calendar quick-add", async () => {
            await waitForCalendarMonthReady(page);
            await waitForCalendarMonthGrid(page, { requireQuickAddButtons: true });

            const quickAddButton = page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY).first();
            if ((await quickAddButton.count()) > 0) {
              if (!(await quickAddButton.isVisible())) {
                const firstDayCell = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL).first();
                if ((await firstDayCell.count()) > 0) {
                  await firstDayCell.hover();
                }
              }
            }

            if ((await quickAddButton.count()) > 0 && (await quickAddButton.isVisible())) {
              await quickAddButton.click();
            } else {
              const headerAddButton = page.getByRole("button", { name: /add event/i });
              await headerAddButton.waitFor({ state: "visible", timeout: 5000 });
              await headerAddButton.click();
            }
            const dialog = await waitForDialogOpen(page);
            await page.getByLabel(/date/i).waitFor({ state: "visible", timeout: 5000 });
            await waitForScreenshotReady(page);
            await captureCurrentView(page, p, "calendar-quick-add");
            await dismissIfOpen(page, dialog);
          });
        }

        if (
          shouldCapture(p, "calendar-drag-and-drop") &&
          supportsCalendarDragAndDropCapture(currentConfigPrefix)
        ) {
          await runCaptureStep("calendar drag-and-drop", async () => {
            const orgCalendarUrl = ROUTES.calendar.build(orgSlug);
            await page.goto(`${BASE_URL}${orgCalendarUrl}`, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            });
            await waitForExpectedContent(page, orgCalendarUrl, "org-calendar");
            await waitForScreenshotReady(page);
            await waitForCalendarMonthReady(page);
            await waitForCalendarEvents(page);

            const dragState = await getCalendarDragState(page);

            if (dragState?.sourceIndex == null || dragState.targetIndex == null) {
              throw new Error(
                `[${p}] Unable to establish calendar drag state (day cells=${dragState?.dayCellCount ?? 0}, events=${dragState?.eventItemCount ?? 0})`,
              );
            }

            const dayCells = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
            const targetCell = dayCells.nth(dragState.targetIndex);
            const sourceCell = dayCells.nth(dragState.sourceIndex);
            const sourceEvent = sourceCell.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();
            const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

            await sourceEvent.scrollIntoViewIfNeeded();
            await targetCell.waitFor({ state: "visible", timeout: 5000 });
            await targetCell.scrollIntoViewIfNeeded();
            await sourceEvent.dispatchEvent("dragstart", { dataTransfer });
            await targetCell.dispatchEvent("dragenter", { dataTransfer });
            await targetCell.dispatchEvent("dragover", { dataTransfer });
            await targetCell
              .getByTestId(TEST_IDS.CALENDAR.DAY_CELL_DROP_TARGET)
              .waitFor({ state: "attached", timeout: 5000 });
            await waitForScreenshotReady(page);
            await captureCurrentView(page, p, "calendar-drag-and-drop");

            await sourceEvent.dispatchEvent("dragend", { dataTransfer });
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
        ROUTES.issues.detail.build(orgSlug, firstIssue),
      );
    }
  }

  // Workspace & team pages
  const wsSlug = seed.workspaceSlug;
  const teamSlug = seed.teamSlug;

  if (wsSlug) {
    const wsBase = ROUTES.workspaces.detail.build(orgSlug, wsSlug);
    const wsTabs = ["backlog", "calendar", "sprints", "dependencies", "wiki", "settings"] as const;
    const workspaceTargets = [
      `workspace-${wsSlug}`,
      ...wsTabs.map((tab) => `workspace-${wsSlug}-${tab}`),
    ];
    if (shouldCaptureAny(p, workspaceTargets)) {
      await takeScreenshot(page, p, `workspace-${wsSlug}`, wsBase);
      for (const tab of wsTabs) {
        await takeScreenshot(page, p, `workspace-${wsSlug}-${tab}`, `${wsBase}/${tab}`);
      }
    }

    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      const teamBase = `${wsBase}/teams/${resolvedTeam}`;
      const teamTabs = ["board", "calendar", "wiki", "settings"] as const;
      const teamTargets = [
        `team-${resolvedTeam}`,
        ...teamTabs.map((tab) => `team-${resolvedTeam}-${tab}`),
      ];
      if (shouldCaptureAny(p, teamTargets)) {
        await takeScreenshot(page, p, `team-${resolvedTeam}`, teamBase);
        for (const tab of teamTabs) {
          await takeScreenshot(page, p, `team-${resolvedTeam}-${tab}`, `${teamBase}/${tab}`);
        }
      }
    }
  }

  // Document editor
  const editorTargets = [
    "document-editor",
    "document-editor-move-dialog",
    "document-editor-markdown-preview-modal",
    "document-editor-favorite",
    "document-editor-sidebar-favorites",
    "document-editor-locked",
    "document-editor-rich-blocks",
    "document-editor-color-picker",
    "document-editor-slash-menu",
    "document-editor-floating-toolbar",
    "document-editor-mention-popover",
  ];
  if (shouldCaptureAny(p, editorTargets)) {
    const baseDocId =
      seed.documentIds?.sprintRetrospectiveNotes ??
      seed.documentIds?.projectRequirements ??
      (await discoverDocumentId(page, orgSlug));
    if (baseDocId) {
      const baseDocUrl = ROUTES.documents.detail.build(orgSlug, baseDocId);
      await takeScreenshot(page, p, "document-editor", baseDocUrl);

      // Document editor interactive states
      if (shouldCapture(p, "document-editor-move-dialog")) {
        await runCaptureStep("document move dialog", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /move to another project/i }).click();
          await page
            .getByRole("dialog", { name: /move document/i })
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-move-dialog");
          await page.keyboard.press("Escape");
        });
      }

      if (shouldCapture(p, "document-editor-markdown-preview-modal")) {
        await runRequiredCaptureStep("document markdown preview modal", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const dialog = await openMarkdownImportPreviewDialog(
            page,
            MARKDOWN_IMPORT_PREVIEW,
            "import.md",
          );
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-markdown-preview-modal");
          await dismissIfOpen(page, dialog);
        });
      }

      if (shouldCapture(p, "document-editor-favorite")) {
        await runCaptureStep("document favorite state", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const toggle = page.getByRole("button", { name: /add to favorites/i });
          await toggle.waitFor({ state: "visible", timeout: 8000 });
          await toggle.click();
          const activeToggle = page.getByRole("button", { name: /remove from favorites/i });
          await activeToggle.waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-favorite");
          await activeToggle.click();
          await toggle.waitFor({ state: "visible", timeout: 5000 });
        });
      }

      if (shouldCapture(p, "document-editor-sidebar-favorites")) {
        await runCaptureStep("document sidebar favorites", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const toggle = page.getByRole("button", { name: /add to favorites/i });
          await toggle.waitFor({ state: "visible", timeout: 8000 });
          await toggle.click();
          const activeToggle = page.getByRole("button", { name: /remove from favorites/i });
          await activeToggle.waitFor({ state: "visible", timeout: 5000 });
          await page
            .locator("aside")
            .getByText("Favorites")
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-sidebar-favorites");
          await activeToggle.click();
          await toggle.waitFor({ state: "visible", timeout: 5000 });
        });
      }

      if (shouldCapture(p, "document-editor-rich-blocks")) {
        await runRequiredCaptureStep("document rich blocks", async () => {
          await primeDocumentEditorRichContent(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-rich-blocks");
        });
      }

      if (shouldCapture(p, "document-editor-color-picker")) {
        await runRequiredCaptureStep("document color picker", async () => {
          await openDocumentEditorFloatingToolbarForCapture(page, baseDocUrl);
          const colorButton = page.getByRole("button", { name: /^text color$/i });
          await colorButton.waitFor({ state: "visible", timeout: 5000 });
          await colorButton.evaluate((button: HTMLElement) => {
            button.click();
          });
          await page.getByTitle("Red").waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-color-picker");
          await page.keyboard.press("Escape");
          await page.mouse.click(10, 10);
        });
      }

      // Slash menu — type "/" at end of content
      if (shouldCapture(p, "document-editor-slash-menu")) {
        await runRequiredCaptureStep("document slash menu", async () => {
          await openDocumentEditorSlashMenuForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-slash-menu");
          // Dismiss and undo
          await page.keyboard.press("Escape");
        });
      }

      // Floating toolbar — select text in the editor
      if (shouldCapture(p, "document-editor-floating-toolbar")) {
        await runRequiredCaptureStep("document floating toolbar", async () => {
          await openDocumentEditorFloatingToolbarForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-floating-toolbar");
          // Click away to deselect
          await page.mouse.click(10, 10);
        });
      }

      // @mention popover — type "@" in editor
      if (shouldCapture(p, "document-editor-mention-popover")) {
        await runRequiredCaptureStep("document mention popover", async () => {
          await openDocumentEditorMentionPopoverForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-mention-popover");
          await page.keyboard.press("Escape");
        });
      }

      if (shouldCapture(p, "document-editor-locked")) {
        await runCaptureStep("document locked state", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /^lock document$/i }).click();
          await page
            .getByRole("alert")
            .filter({ hasText: /document locked/i })
            .first()
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-locked");
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /^unlock document$/i }).click();
          await page
            .getByRole("alert")
            .filter({ hasText: /document locked/i })
            .first()
            .waitFor({ state: "hidden", timeout: 5000 });
        });
      }
    }
  }

  // ── Additional modal captures ──

  // Dashboard customize modal
  if (shouldCapture(p, "dashboard-customize-modal")) {
    await runCaptureStep("dashboard customize modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /^customize$/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /dashboard customization/i }),
        page.getByText("Quick Stats", { exact: true }),
        "dashboard customize",
      );
      await waitForDashboardCustomizeDialogReady(page);
      await captureCurrentView(page, p, "dashboard-customize-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create event modal (from calendar)
  if (projectKey && shouldCapture(p, "calendar-create-event-modal")) {
    await runCaptureStep("calendar create-event modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.projects.calendar.build(orgSlug, projectKey)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      await waitForCalendarReady(page);
      const trigger = page.getByRole("button", { name: /add event/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^create event$/i }),
        page.getByLabel(/event title/i),
        "calendar create event",
      );
      await captureCurrentView(page, p, "calendar-create-event-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create workspace modal
  if (shouldCapture(p, "workspaces-create-workspace-modal")) {
    await runCaptureStep("create workspace modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.workspaces.list.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.workspaces.list.build(orgSlug), "workspaces", p);
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByText("Create Workspace");
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^create workspace$/i }),
        page.getByRole("dialog", { name: /^create workspace$/i }).getByLabel(/^workspace name$/i),
        "create workspace",
      );
      await captureCurrentView(page, p, "workspaces-create-workspace-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create team modal (from workspace detail)
  if (wsSlug && shouldCapture(p, "workspace-create-team-modal")) {
    await runCaptureStep("create team modal", async () => {
      const wsBase = ROUTES.workspaces.detail.build(orgSlug, wsSlug);
      await page.goto(`${BASE_URL}${wsBase}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, wsBase, `workspace-${wsSlug}`);
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByText("Create Team");
      await trigger.waitFor({ state: "visible", timeout: 10000 });
      await trigger.click();
      const dialog = await waitForDialogOpen(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "workspace-create-team-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Import/export modal (from board)
  if (projectKey && shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal`)) {
    await runCaptureStep("import/export modal", async () => {
      const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, boardUrl, "board");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /import \/ export/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^import \/ export issues$/i }),
        page.getByText("Select Export Format", { exact: true }),
        "import/export",
      );
      await captureCurrentView(page, p, `project-${normalizedProjectKey}-import-export-modal`);
      await dismissIfOpen(page, dialog);
    });
  }

  if (
    projectKey &&
    shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal-import`)
  ) {
    await runCaptureStep("import/export modal import state", async () => {
      const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, boardUrl, "board");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /import \/ export/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^import \/ export issues$/i }),
        page.getByText("Select Export Format", { exact: true }),
        "import/export",
      );
      await dialog.getByRole("radio", { name: /import issues/i }).click();
      await dialog.getByText("JSON", { exact: true }).click();
      await dialog
        .getByText("JSON files must contain an issues array at the top level.", { exact: true })
        .waitFor({
          state: "visible",
          timeout: 5000,
        });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        p,
        `project-${normalizedProjectKey}-import-export-modal-import`,
      );
      await dismissIfOpen(page, dialog);
    });
  }

  // Manual time entry modal
  if (shouldCapture(p, "time-tracking-manual-entry-modal")) {
    await runCaptureStep("manual time entry modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.timeTracking.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.timeTracking.build(orgSlug), "time-tracking");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /add time entry/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^log time$/i }),
        page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM),
        "manual time entry",
      );
      await captureCurrentView(page, p, "time-tracking-manual-entry-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // ── Navigation / Shell states ──

  // Sidebar collapsed
  if (
    shouldCapture(p, "sidebar-collapsed") &&
    (currentConfigPrefix === "desktop-dark" || currentConfigPrefix === "desktop-light")
  ) {
    await runCaptureStep("sidebar collapsed", async () => {
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      const collapseBtn = page.getByLabel("Collapse sidebar");
      await collapseBtn.waitFor({ state: "visible", timeout: 5000 });
      await collapseBtn.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "sidebar-collapsed");
      // Expand back
      const expandBtn = page.getByLabel("Expand sidebar");
      if (await isLocatorVisible(expandBtn)) {
        await expandBtn.click();
        await waitForScreenshotReady(page);
      }
    });
  }

  if (
    shouldCapture(p, "mobile-hamburger") &&
    (currentConfigPrefix === "tablet-light" || currentConfigPrefix === "mobile-light")
  ) {
    await runCaptureStep("mobile hamburger", async () => {
      const dashboardUrl = ROUTES.dashboard.build(orgSlug);
      await page.goto(`${BASE_URL}${dashboardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, dashboardUrl, "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      await openMobileSidebarMenu(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "mobile-hamburger");
    });
  }

  if (shouldCapture(p, "project-tree")) {
    await runCaptureStep("project tree", async () => {
      const teamBoardUrl = ROUTES.workspaces.teams.board.build(
        orgSlug,
        seed.workspaceSlug ?? "product",
        seed.teamSlug ?? "engineering",
      );
      await page.goto(`${BASE_URL}${teamBoardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, teamBoardUrl, "team");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);

      if (currentConfigPrefix === "tablet-light" || currentConfigPrefix === "mobile-light") {
        await openMobileSidebarMenu(page);
      }

      await page
        .getByRole("link", { name: /DEMO - Demo Project/i })
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "project-tree");
    });
  }

  // 404 page (navigate to bogus URL while authenticated)
  if (shouldCapture(p, "404-page")) {
    await runCaptureStep("404 page", async () => {
      await page.goto(`${BASE_URL}/${orgSlug}/nonexistent-page-screenshot-test`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      // Wait for the 404 content to render
      await page
        .getByText(/not found|page.*not.*found|404/i)
        .first()
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "404-page");
    });
  }

  // ── Roadmap interactive states ──

  if (projectKey && shouldCapture(p, `project-${normalizedProjectKey}-roadmap-timeline-selector`)) {
    await runCaptureStep("roadmap timeline selector", async () => {
      const roadmapUrl = ROUTES.projects.roadmap.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${roadmapUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, roadmapUrl, "roadmap");
      await waitForScreenshotReady(page);
      // Click the timeline span select trigger (shows "3 Months" by default)
      const selectTrigger = page
        .getByRole("combobox")
        .filter({ hasText: /month|year/i })
        .first();
      await selectTrigger.waitFor({ state: "visible", timeout: 5000 });
      await selectTrigger.click();
      // Wait for dropdown options
      await page
        .getByRole("option", { name: /1 month/i })
        .first()
        .waitFor({ state: "visible", timeout: 3000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        p,
        `project-${normalizedProjectKey}-roadmap-timeline-selector`,
      );
      // Close dropdown
      await page.keyboard.press("Escape");
    });
  }

  // ── Notification interactive states ──

  async function openNotificationPanel(): Promise<Locator> {
    const bellButton = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_BUTTON);
    const panel = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_PANEL);
    let lastError: Error | null = null;

    await bellButton.waitFor({ state: "visible", timeout: 5000 });

    if (await panel.isVisible()) {
      return panel;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await bellButton.click();
        await panel.waitFor({ state: "visible", timeout: 5000 });
        await panel.getByRole("heading", { name: /^notifications$/i }).waitFor({
          state: "visible",
          timeout: 5000,
        });
        await waitForAnimation(page);
        return panel;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden", timeout: 2000 });
      }
    }

    throw new Error(`Notification panel did not open: ${lastError?.message ?? "unknown error"}`);
  }

  async function waitForNotificationsContentReady(): Promise<void> {
    const notificationItems = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM);
    const emptyState = page.getByText(/no notifications/i);
    const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });

    await expect
      .poll(
        async () => {
          const mentionsVisible = await isLocatorVisible(mentionsFilter);
          const itemCount = await getLocatorCount(notificationItems);
          const emptyVisible = await isLocatorVisible(emptyState);

          return mentionsVisible && (itemCount > 0 || emptyVisible) ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected notifications content or empty state to become visible",
        },
      )
      .toBe("ready");
  }

  async function waitForMentionsFilterState(): Promise<void> {
    const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
    const mentionNotification = page.getByText(/you were mentioned/i);
    const emptyState = page.getByText(/no notifications/i);

    await expect
      .poll(
        async () => {
          const classes = (await getLocatorAttribute(mentionsFilter, "class", "")) ?? "";
          const filterActive = classes.includes("bg-ui-bg-secondary");
          const mentionVisible = await isLocatorVisible(mentionNotification);
          const emptyVisible = await isLocatorVisible(emptyState);

          return filterActive && (mentionVisible || emptyVisible) ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected Mentions filter results to finish rendering",
        },
      )
      .toBe("ready");

    await waitForAnimation(page);
  }

  // Notification popover (bell icon in header)
  if (shouldCapture(p, "notification-popover")) {
    await runCaptureStep("notification popover", async () => {
      // Navigate to dashboard to have a clean header
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      await openNotificationPanel();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notification-popover");
      // Close popover
      await page.keyboard.press("Escape");
    });
  }

  if (shouldCapture(p, "notification-snooze-popover")) {
    await runCaptureStep("notification snooze popover", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);

      const firstNotification = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM).first();
      await firstNotification.waitFor({ state: "visible", timeout: 5000 });
      await firstNotification.hover();
      await waitForAnimation(page);

      const snoozeButton = firstNotification.getByRole("button", { name: /snooze notification/i });
      await snoozeButton.waitFor({ state: "visible", timeout: 5000 });
      await snoozeButton.click();

      await page.getByText(/snooze until/i).waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notification-snooze-popover");
      await page.keyboard.press("Escape");
    });
  }

  // Notifications page — archived tab
  if (shouldCapture(p, "notifications-archived")) {
    await runCaptureStep("notifications archived tab", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForScreenshotReady(page);
      const archivedTab = page.getByRole("tab", { name: /archived/i });
      await archivedTab.waitFor({ state: "visible", timeout: 5000 });
      await archivedTab.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notifications-archived");
    });
  }

  // Notifications page — filter active (Mentions filter)
  if (shouldCapture(p, "notifications-filter-active")) {
    await runCaptureStep("notifications filter active", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForNotificationsContentReady();
      // Click the Mentions filter button
      const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
      await mentionsFilter.waitFor({ state: "visible", timeout: 5000 });
      await mentionsFilter.click();
      await waitForMentionsFilterState();
      await captureCurrentView(page, p, "notifications-filter-active");
    });
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

  await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
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
        await omniboxDialog.waitFor({ state: "hidden", timeout: 5000 });
        const advancedSearchDialog = page.getByTestId(TEST_IDS.SEARCH.ADVANCED_MODAL);
        await advancedSearchDialog.waitFor({ state: "visible", timeout: 5000 });
        await waitForAnimation(page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, "dashboard-advanced-search-modal");
        await dismissIfOpen(page, advancedSearchDialog);
      } finally {
        await dismissIfOpen(page, omniboxDialog);
      }
    });
  }

  const shortcutsTrigger = page.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
  if (currentConfigPrefix !== "mobile-light" && (await shortcutsTrigger.count()) > 0) {
    await runCaptureStep("dashboard shortcuts modal", async () => {
      await dismissAllDialogs(page);
      const shortcutsDialog = await openStableDialog(
        page,
        shortcutsTrigger,
        page.getByRole("dialog", { name: /keyboard shortcuts/i }),
        page.getByPlaceholder("Search shortcuts..."),
        "shortcuts help",
      );
      await captureCurrentView(page, prefix, "dashboard-shortcuts-modal");
      await dismissIfOpen(page, shortcutsDialog);
    });
  }

  const timeEntryTrigger = page.getByRole("button", { name: /^start timer$/i });
  if ((await timeEntryTrigger.count()) > 0) {
    await runCaptureStep("dashboard time-entry modal", async () => {
      await dismissAllDialogs(page);
      const timeEntryDialog = await openStableDialog(
        page,
        timeEntryTrigger,
        page.getByRole("dialog", { name: /^start timer$/i }),
        page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM),
        "dashboard time entry",
      );
      await captureCurrentView(page, prefix, "dashboard-time-entry-modal");
      await dismissIfOpen(page, timeEntryDialog);
    });
  }
}

async function screenshotDashboardLoadingState(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "dashboard-loading-skeletons")) {
    return;
  }

  await runCaptureStep("dashboard loading skeletons", async () => {
    const loadingPage = await page.context().newPage();

    try {
      await loadingPage.addInitScript(() => {
        window.__NIXELO_E2E_DASHBOARD_LOADING__ = true;
      });

      const dashboardUrl = ROUTES.dashboard.build(orgSlug);
      await loadingPage.goto(`${BASE_URL}${dashboardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await loadingPage.waitForURL(
        (currentUrl) => /\/[^/]+\/dashboard$/.test(new URL(currentUrl).pathname),
        {
          timeout: 15000,
        },
      );
      await loadingPage
        .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
        .waitFor({ state: "visible", timeout: 15000 });
      await loadingPage
        .getByRole("heading", { name: /^dashboard$/i })
        .waitFor({ state: "visible", timeout: 12000 });
      await expect
        .poll(() => loadingPage.getByTestId(TEST_IDS.LOADING.SKELETON).count(), {
          timeout: 12000,
        })
        .toBeGreaterThanOrEqual(6);
      await waitForAnimation(loadingPage);
      await loadingPage.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }),
      );
      await captureCurrentView(loadingPage, prefix, "dashboard-loading-skeletons", {
        skipReadyCheck: true,
      });
    } finally {
      if (!loadingPage.isClosed()) {
        await loadingPage.close();
      }
    }
  });
}

async function screenshotProjectsModal(page: Page, orgSlug: string, prefix: string): Promise<void> {
  if (!shouldCapture(prefix, "projects-create-project-modal")) {
    return;
  }

  await page.goto(`${BASE_URL}${ROUTES.projects.list.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
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
  const issueDetailInlineEditingName = `project-${normalizedProjectKey}-issue-detail-modal-inline-editing`;
  if (
    !shouldCaptureAny(prefix, [
      createIssueModalName,
      issueDetailModalName,
      issueDetailInlineEditingName,
    ])
  ) {
    return;
  }

  const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
  await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
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

  if (
    shouldCaptureAny(prefix, [issueDetailModalName, issueDetailInlineEditingName]) &&
    (await issueCard.count()) > 0
  ) {
    await runCaptureStep("board issue-detail modal", async () => {
      await issueCard.scrollIntoViewIfNeeded();
      const issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
      await issueCard.click();
      const dialogOpened = await waitForLocatorVisible(issueDetailDialog, 3000);
      if (!dialogOpened) {
        await waitForScreenshotReady(page);
        await issueCard.click();
        await issueDetailDialog.waitFor({ state: "visible", timeout: 5000 });
      }
      // Wait for issue content to hydrate - issue key pattern indicates content is loaded
      await issueDetailDialog
        .getByText(/[A-Z][A-Z0-9]+-\d+/)
        .first()
        .waitFor({ timeout: 5000 });

      if (shouldCapture(prefix, issueDetailModalName)) {
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, issueDetailModalName);
      }

      if (shouldCapture(prefix, issueDetailInlineEditingName)) {
        await projectsPage.issueDetailEditButton.waitFor({ state: "visible", timeout: 5000 });
        await projectsPage.issueDetailEditButton.click();
        await projectsPage.issueDetailTitleInput.waitFor({ state: "visible", timeout: 5000 });
        await projectsPage.issueDetailDescriptionEditor.waitFor({
          state: "visible",
          timeout: 5000,
        });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, issueDetailInlineEditingName);
      }

      await dismissIfOpen(page, issueDetailDialog);
    });
  }
}

async function screenshotMeetingsStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const meetingsDetailName = "meetings-detail";
  const transcriptSearchName = "meetings-transcript-search";
  const memoryLensName = "meetings-memory-lens";
  const detailTimeoutMs = 15000;

  if (!shouldCaptureAny(prefix, [meetingsDetailName, transcriptSearchName, memoryLensName])) {
    return;
  }

  const meetingsUrl = ROUTES.meetings.build(orgSlug);
  const recentMeetingsSection = page.getByTestId(TEST_IDS.MEETINGS.RECENT_SECTION);
  const meetingDetailSection = page.getByTestId(TEST_IDS.MEETINGS.DETAIL_SECTION);
  const meetingMemorySection = page.getByTestId(TEST_IDS.MEETINGS.MEMORY_SECTION);

  const openMeetingsForCapture = async () => {
    await page.goto(`${BASE_URL}${meetingsUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, meetingsUrl, "meetings");
    await waitForScreenshotReady(page);
  };

  if (shouldCapture(prefix, meetingsDetailName)) {
    await runCaptureStep("meetings detail", async () => {
      await openMeetingsForCapture();
      const clientLaunchReviewCard = recentMeetingsSection
        .getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD)
        .filter({ hasText: /Client Launch Review/i })
        .first();
      await clientLaunchReviewCard.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await clientLaunchReviewCard.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingDetailSection
        .getByText("Client Launch Review", { exact: true })
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await meetingDetailSection
        .getByText(
          "The client also asked whether they need weekend coverage and a final handoff packet before launch.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, meetingsDetailName);
    });
  }

  if (shouldCapture(prefix, transcriptSearchName)) {
    await runCaptureStep("meetings transcript search", async () => {
      await openMeetingsForCapture();
      const weeklyProductSyncCard = recentMeetingsSection
        .getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD)
        .filter({ hasText: /Weekly Product Sync/i })
        .first();
      await weeklyProductSyncCard.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await weeklyProductSyncCard.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingDetailSection
        .getByText("Weekly Product Sync", { exact: true })
        .waitFor({ state: "visible", timeout: detailTimeoutMs });

      const transcriptSearch = meetingDetailSection.getByRole("searchbox", {
        name: "Search transcript",
      });
      await transcriptSearch.fill("pricing");
      await meetingDetailSection
        .getByText(
          "We cleared the dashboard bugs, but pricing approval still needs legal sign-off before launch.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, transcriptSearchName);
    });
  }

  if (shouldCapture(prefix, memoryLensName)) {
    await runCaptureStep("meetings memory lens", async () => {
      await openMeetingsForCapture();
      const opsLensButton = meetingMemorySection
        .locator("button")
        .filter({ hasText: /OPS/i })
        .first();
      await opsLensButton.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await opsLensButton.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingMemorySection
        .getByText(
          "Cross-meeting decisions, open questions, and follow-ups for OPS - Client Operations Hub.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, memoryLensName);
    });
  }
}

async function screenshotBoardInteractiveStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);

  // Helper: navigate to board and wait for toolbar
  const loadBoard = async () => {
    await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForBoardReady(page);
    await waitForScreenshotReady(page);
  };

  // Swimlane modes — reload board fresh for each to avoid stale button text
  const swimlaneModes = ["priority", "assignee", "type", "label"] as const;
  for (const mode of swimlaneModes) {
    const captureName = `project-${normalizedProjectKey}-board-swimlane-${mode}`;
    if (!shouldCapture(prefix, captureName)) continue;

    await runCaptureStep(`board swimlane ${mode}`, async () => {
      await loadBoard();
      // Open swimlane dropdown — button says "Swimlanes" on fresh load
      const swimlaneButton = page.getByText("Swimlanes", { exact: true });
      await swimlaneButton.waitFor({ state: "visible", timeout: 8000 });
      await swimlaneButton.click();
      // Select the mode via menuitemcheckbox to avoid matching hidden mobile
      // text or other page elements with the same label.
      const modeLabel = mode[0].toUpperCase() + mode.slice(1);
      const option = page.getByRole("menuitemcheckbox", { name: modeLabel, exact: true });
      await option.waitFor({ state: "visible", timeout: 3000 });
      // Radix DropdownMenuCheckboxItem may detach on check. Use scrollIntoView
      // + click in quick succession to minimize the race window.
      await option.scrollIntoViewIfNeeded();
      await option.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureName);
    });
  }

  // Column collapsed — scope to board columns, not sidebar
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-column-collapsed`)) {
    await runCaptureStep("board column collapsed", async () => {
      await loadBoard();
      // Find collapse button INSIDE a board column header (not sidebar)
      const columnHeader = page.getByTestId(TEST_IDS.BOARD.COLUMN).first();
      const collapseButton = columnHeader.getByLabel(/collapse/i);
      await collapseButton.waitFor({ state: "visible", timeout: 8000 });
      await collapseButton.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-board-column-collapsed`,
      );
      // Expand it back
      const expandButton = page.getByLabel(/expand/i).first();
      if (await isLocatorVisible(expandButton)) {
        await expandButton.click();
        await waitForScreenshotReady(page);
      }
    });
  }

  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-empty-column`)) {
    await runCaptureStep("board empty column", async () => {
      const emptyColumnWorkflowStates: E2EWorkflowState[] = [
        { id: "triage", name: "Triage", category: "todo", order: 0 },
        ...DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES.map((state, index) => ({
          ...state,
          order: index + 1,
        })),
      ];

      const updateResult = await testUserService.replaceProjectWorkflowStates(
        orgSlug,
        projectKey,
        emptyColumnWorkflowStates,
      );
      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to configure empty board column");
      }

      try {
        await loadBoard();
        const triageColumn = page.getByLabel(/triage column/i);
        await triageColumn.waitFor({ state: "visible", timeout: 8000 });
        await triageColumn.getByText("No issues yet", { exact: true }).waitFor({ timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          prefix,
          `project-${normalizedProjectKey}-board-empty-column`,
        );
      } finally {
        await testUserService.replaceProjectWorkflowStates(
          orgSlug,
          projectKey,
          DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES,
        );
      }
    });
  }

  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-wip-limit-warning`)) {
    await runCaptureStep("board WIP limit warning", async () => {
      const stateId = "todo";
      const warningLimit = 1;
      const updateResult = await testUserService.updateProjectWorkflowState(
        orgSlug,
        projectKey,
        stateId,
        warningLimit,
      );
      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to configure board WIP limit");
      }

      try {
        await loadBoard();
        await page.getByText("Over limit", { exact: true }).first().waitFor({ timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          prefix,
          `project-${normalizedProjectKey}-board-wip-limit-warning`,
        );
      } finally {
        await testUserService.updateProjectWorkflowState(orgSlug, projectKey, stateId, null);
      }
    });
  }

  // Filter bar active (apply a Priority filter)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-filter-active`)) {
    await runCaptureStep("board filter active", async () => {
      await loadBoard();
      // The filter bar "Priority" button has icon text "Pri" + label "Priority"
      const priorityFilter = page.getByRole("button", { name: /priority/i }).nth(0);
      await priorityFilter.waitFor({ state: "visible", timeout: 8000 });
      await priorityFilter.click();
      const highOption = page
        .locator("[role='menuitemcheckbox']")
        .filter({ hasText: "High" })
        .first();
      await highOption.waitFor({ state: "visible", timeout: 5000 });
      await highOption.click();
      // Close dropdown
      await page.keyboard.press("Escape");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-filter-active`);
    });
  }

  // Display properties dropdown open
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-display-properties`)) {
    await runCaptureStep("board display properties", async () => {
      await loadBoard();
      const propsButton = page.getByText("Properties", { exact: true });
      await propsButton.waitFor({ state: "visible", timeout: 8000 });
      await propsButton.click();
      // Wait for dropdown to be visible
      await page.getByRole("menuitemcheckbox").first().waitFor({ state: "visible", timeout: 3000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-board-display-properties`,
      );
      // Close dropdown
      await page.keyboard.press("Escape");
    });
  }

  // Peek / side panel mode — toggle view mode, click issue card
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-peek-mode`)) {
    await runCaptureStep("board peek mode", async () => {
      await loadBoard();
      // Toggle to side panel mode
      const toggleBtn = page.getByLabel(/switch to side panel view/i);
      await toggleBtn.waitFor({ state: "visible", timeout: 8000 });
      await toggleBtn.click();
      await waitForScreenshotReady(page);

      // Click an issue card to open side panel
      const board = page.getByTestId(TEST_IDS.BOARD.ROOT);
      const issueCard = board.getByTestId(TEST_IDS.ISSUE.CARD).first();
      await issueCard.waitFor({ state: "visible", timeout: 5000 });
      await issueCard.click();

      // Wait for the side panel to appear (Sheet component with data-testid)
      await page
        .getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL)
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-peek-mode`);

      // Close panel and reset to modal view
      await page.keyboard.press("Escape");
      const resetBtn = page.getByLabel(/switch to modal view/i);
      if (await isLocatorVisible(resetBtn)) {
        await resetBtn.click();
      }
    });
  }
}

async function screenshotSprintInteractiveStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const sprintsUrl = ROUTES.projects.sprints.build(orgSlug, projectKey);

  // Navigate to sprints page
  await page.goto(`${BASE_URL}${sprintsUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForExpectedContent(page, sprintsUrl, "sprints");
  await waitForScreenshotReady(page);

  // Burndown chart (default view — click "Burndown" to ensure it's active)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burndown`)) {
    await runCaptureStep("sprint burndown chart", async () => {
      const burndownBtn = page.getByRole("button", { name: /^burndown$/i });
      if (await isLocatorVisible(burndownBtn)) {
        await burndownBtn.click();
        await waitForScreenshotReady(page);
      }
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burndown`);
    });
  }

  // Burnup chart (toggle)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burnup`)) {
    await runCaptureStep("sprint burnup chart", async () => {
      const burnupBtn = page.getByRole("button", { name: /^burnup$/i });
      await burnupBtn.waitFor({ state: "visible", timeout: 5000 });
      await burnupBtn.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burnup`);
      // Switch back to burndown
      const burndownBtn = page.getByRole("button", { name: /^burndown$/i });
      if (await isLocatorVisible(burndownBtn)) {
        await burndownBtn.click();
      }
    });
  }

  // Workload popover
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-workload`)) {
    await runCaptureStep("sprint workload popover", async () => {
      const workloadBtn = page.getByRole("button", { name: /assignees/i });
      await workloadBtn.waitFor({ state: "visible", timeout: 5000 });
      await workloadBtn.click();
      // Wait for popover content
      await page
        .getByText(/workload distribution/i)
        .first()
        .waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-workload`);
      // Close popover
      await page.keyboard.press("Escape");
    });
  }

  // Create sprint overlap warning
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-date-overlap-warning`)) {
    await runCaptureStep("sprint date overlap warning", async () => {
      let startSprintButton = page.getByRole("button", { name: /^start sprint$/i });

      if (!(await isLocatorVisible(startSprintButton))) {
        const createSprintButton = page
          .getByRole("button", { name: /create sprint|\+\s*sprint/i })
          .first();
        await createSprintButton.waitFor({ state: "visible", timeout: 5000 });
        await createSprintButton.click();

        const sprintNameInput = page.getByLabel("Sprint Name");
        await sprintNameInput.waitFor({ state: "visible", timeout: 5000 });

        const createForm = page.getByTestId(TEST_IDS.SPRINT.CREATE_FORM);
        await createForm.waitFor({ state: "visible", timeout: 5000 });
        await sprintNameInput.fill("Overlap Warning Sprint");
        await createForm.evaluate((form) => {
          (form as HTMLFormElement).requestSubmit();
        });

        startSprintButton = page.getByRole("button", { name: /^start sprint$/i });
        await startSprintButton.waitFor({ state: "visible", timeout: 5000 });
      }

      await startSprintButton.waitFor({ state: "visible", timeout: 5000 });
      await startSprintButton.click();

      const dialog = page.getByRole("dialog", { name: /^start sprint$/i });
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      const overlapWarning = dialog.getByText(/these dates overlap with:/i).first();
      await overlapWarning.waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await overlapWarning.scrollIntoViewIfNeeded();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-date-overlap-warning`,
      );
      await dismissIfOpen(page, dialog);
    });
  }

  // Complete sprint modal
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-completion-modal`)) {
    await runCaptureStep("sprint completion modal", async () => {
      const completeSprintButton = page
        .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
        .getByRole("button", { name: /^complete sprint$/i })
        .first();
      await completeSprintButton.waitFor({ state: "visible", timeout: 5000 });
      await completeSprintButton.click();

      const dialog = page.getByRole("dialog", { name: /^complete sprint$/i });
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await dialog
        .getByText(/issues? not completed\. choose what to do with them\./i)
        .waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-completion-modal`,
      );
      await dismissIfOpen(page, dialog);
    });
  }
}

async function screenshotIssueInteractiveStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "issues-side-panel")) {
    return;
  }

  const issuesUrl = ROUTES.issues.list.build(orgSlug);

  await runCaptureStep("issues side panel", async () => {
    await page.goto(`${BASE_URL}${issuesUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, issuesUrl, "issues", prefix);
    await waitForScreenshotReady(page);

    const toggleBtn = page
      .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
      .getByRole("button", { name: /switch to side panel view/i })
      .first();
    await toggleBtn.waitFor({ state: "visible", timeout: 8000 });
    await toggleBtn.click();
    await waitForScreenshotReady(page);

    const issueCard = page
      .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .first();
    await issueCard.waitFor({ state: "visible", timeout: 5000 });
    await issueCard.click();

    const issueDetailPanel = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    await issueDetailPanel.waitFor({ state: "visible", timeout: 5000 });
    await issueDetailPanel
      .getByText(/[A-Z][A-Z0-9]+-\d+/)
      .first()
      .waitFor({ timeout: 5000 });
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "issues-side-panel");

    await dismissIfOpen(page, issueDetailPanel);
    const resetBtn = page.getByRole("button", { name: /switch to modal view/i });
    if (await isLocatorVisible(resetBtn)) {
      await resetBtn.click();
    }
  });
}

// ---------------------------------------------------------------------------
// Main capture function for a single viewport/theme combination
// ---------------------------------------------------------------------------

/**
 * Authenticate, navigate to the app gateway, and return the page ready
 * for authenticated captures. Returns null if auth fails.
 */
async function authenticateAndNavigate(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}${ROUTES.signin.build()}`, { waitUntil: "domcontentloaded" });
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );

  if (!loginResult.success || !loginResult.token) {
    return false;
  }

  await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
  await page.goto(`${BASE_URL}${ROUTES.app.build()}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL((u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname), {
    timeout: 15000,
  });
  await waitForScreenshotReady(page);
  return true;
}

/**
 * Capture empty states for a single viewport/theme combination.
 * Must run BEFORE data is seeded so pages genuinely show empty UI.
 */
async function captureEmptyForConfig(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
): Promise<void> {
  currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}) [empty]`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
  });
  const page = await context.newPage();

  try {
    if (!(await authenticateAndNavigate(page))) {
      captureFailures++;
      console.log(`    ⚠️ Auth failed for ${currentConfigPrefix} empty states`);
      return;
    }
    await screenshotEmptyStates(page, orgSlug);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureFailures++;
    console.log(`    ⚠️ Empty state capture failed for ${currentConfigPrefix}: ${message}`);
  } finally {
    await context.close();
  }
}

/**
 * Capture public pages and filled states for a single viewport/theme combination.
 * Runs AFTER data has been seeded.
 */
async function captureFilledForConfig(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  seedResult: SeedScreenshotResult,
): Promise<void> {
  currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}) [public + filled]`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
  });
  const page = await context.newPage();

  // Public pages (no auth needed, but some need seed data for tokens)
  await screenshotPublicPages(page, seedResult);

  try {
    if (!(await authenticateAndNavigate(page))) {
      captureFailures++;
      console.log(`    ⚠️ Auth failed for ${currentConfigPrefix} filled states`);
      return;
    }

    const filledOrgSlug = seedResult.orgSlug ?? orgSlug;
    await screenshotFilledStates(page, filledOrgSlug, seedResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureFailures++;
    console.log(`    ⚠️ Filled state capture failed for ${currentConfigPrefix}: ${message}`);
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

/** Known page IDs captured during a full run (excluding dynamic project/workspace/team slugs). */
const DRY_RUN_PAGES = [
  // Public
  "public-landing",
  "public-signin",
  "public-signup",
  "public-signup-verify",
  "public-forgot-password",
  "public-forgot-password-reset",
  "public-verify-email",
  "public-verify-2fa",
  "public-invite",
  "public-invite-invalid",
  "public-unsubscribe",
  "public-portal",
  "public-portal-project",
  // Empty states
  "empty-dashboard",
  "empty-projects",
  "empty-issues",
  "empty-documents",
  "empty-documents-templates",
  "empty-workspaces",
  "empty-time-tracking",
  "empty-notifications",
  "empty-my-issues",
  "empty-invoices",
  "empty-clients",
  "empty-meetings",
  "empty-settings",
  "empty-settings-profile",
  // Filled states — top-level
  "filled-dashboard",
  "filled-projects",
  "filled-issues",
  "filled-documents",
  "filled-documents-templates",
  "filled-workspaces",
  "filled-time-tracking",
  "filled-notifications",
  "filled-my-issues",
  "filled-org-calendar",
  "filled-org-analytics",
  "filled-invoices",
  "filled-clients",
  "filled-meetings",
  "filled-meetings-detail",
  "filled-meetings-transcript-search",
  "filled-meetings-memory-lens",
  "filled-settings",
  "filled-settings-profile",
  "filled-settings-integrations",
  "filled-settings-admin",
  "filled-settings-notifications",
  "filled-settings-security",
  "filled-settings-apikeys",
  "filled-settings-preferences",
  "filled-settings-offline",
  "filled-authentication",
  "filled-add-ons",
  "filled-assistant",
  "filled-mcp-server",
  // Filled states — dashboard modals
  "filled-dashboard-omnibox",
  "filled-dashboard-advanced-search-modal",
  "filled-dashboard-shortcuts-modal",
  "filled-dashboard-time-entry-modal",
  "filled-dashboard-customize-modal",
  "filled-dashboard-loading-skeletons",
  "filled-settings-profile-avatar-upload-modal",
  "filled-settings-profile-cover-upload-modal",
  "filled-settings-notifications-permission-denied",
  // Filled states — projects modals
  "filled-projects-create-project-modal",
  "filled-issues-side-panel",
  // Filled states — workspace modals
  "filled-workspaces-create-workspace-modal",
  "filled-workspace-create-team-modal",
  // Filled states — project sub-pages (use PROJ as placeholder key)
  "filled-project-PROJ-board",
  "filled-project-PROJ-backlog",
  "filled-project-PROJ-inbox",
  "filled-project-PROJ-sprints",
  "filled-project-PROJ-roadmap",
  "filled-project-PROJ-calendar",
  "filled-project-PROJ-activity",
  "filled-project-PROJ-analytics",
  "filled-project-PROJ-billing",
  "filled-project-PROJ-timesheet",
  "filled-project-PROJ-members",
  "filled-project-PROJ-members-confirm-dialog",
  "filled-project-PROJ-settings",
  "filled-project-PROJ-settings-delete-alert-dialog",
  "filled-project-PROJ-create-issue-modal",
  "filled-project-PROJ-issue-detail-modal",
  "filled-project-PROJ-issue-detail-modal-inline-editing",
  "filled-project-PROJ-import-export-modal",
  "filled-project-PROJ-import-export-modal-import",
  // Filled states — board interactive states
  "filled-project-PROJ-board-swimlane-priority",
  "filled-project-PROJ-board-swimlane-assignee",
  "filled-project-PROJ-board-swimlane-type",
  "filled-project-PROJ-board-swimlane-label",
  "filled-project-PROJ-board-column-collapsed",
  "filled-project-PROJ-board-empty-column",
  "filled-project-PROJ-board-wip-limit-warning",
  "filled-project-PROJ-board-filter-active",
  "filled-project-PROJ-board-display-properties",
  "filled-project-PROJ-board-peek-mode",
  "filled-project-PROJ-board-sprint-selector",
  "filled-project-PROJ-create-issue-draft-restoration",
  "filled-project-PROJ-create-issue-duplicate-detection",
  "filled-project-PROJ-create-issue-create-another",
  "filled-project-PROJ-create-issue-validation",
  "filled-project-PROJ-create-issue-success-toast",
  // Filled states — sprint interactive states
  "filled-project-PROJ-sprints-burndown",
  "filled-project-PROJ-sprints-burnup",
  "filled-project-PROJ-sprints-completion-modal",
  "filled-project-PROJ-sprints-date-overlap-warning",
  "filled-project-PROJ-sprints-workload",
  // Filled states — calendar modes
  "filled-calendar-day",
  "filled-calendar-week",
  "filled-calendar-month",
  "filled-calendar-event-modal",
  "filled-calendar-create-event-modal",
  "filled-calendar-drag-and-drop",
  "filled-calendar-quick-add",
  // Filled states — time tracking modals
  "filled-time-tracking-manual-entry-modal",
  // Filled states — issue detail
  "filled-issue-PROJ-1",
  // Filled states — document editor
  "filled-document-editor",
  "filled-document-editor-move-dialog",
  "filled-document-editor-markdown-preview-modal",
  "filled-document-editor-favorite",
  "filled-document-editor-sidebar-favorites",
  "filled-document-editor-locked",
  "filled-document-editor-rich-blocks",
  "filled-document-editor-color-picker",
  "filled-document-editor-slash-menu",
  "filled-document-editor-floating-toolbar",
  "filled-document-editor-mention-popover",
  // Filled states — workspace sub-pages (use WS as placeholder slug)
  "filled-workspace-WS",
  "filled-workspace-WS-backlog",
  "filled-workspace-WS-calendar",
  "filled-workspace-WS-sprints",
  "filled-workspace-WS-dependencies",
  "filled-workspace-WS-wiki",
  "filled-workspace-WS-settings",
  // Filled states — team sub-pages (use TEAM as placeholder slug)
  "filled-team-TEAM",
  "filled-team-TEAM-board",
  "filled-team-TEAM-calendar",
  "filled-team-TEAM-wiki",
  "filled-team-TEAM-settings",
  // Filled states — roadmap interactive states
  "filled-project-PROJ-roadmap-timeline-selector",
  // Filled states — notification interactive states
  "filled-notification-popover",
  "filled-notification-snooze-popover",
  "filled-notifications-archived",
  "filled-notifications-filter-active",
  "filled-project-tree",
  // Filled states — navigation / shell states
  "filled-sidebar-collapsed",
  "filled-mobile-hamburger",
  // Error / edge states
  "filled-404-page",
];

function dryRunEnumerate(
  configs: Array<{ viewport: keyof typeof VIEWPORTS; theme: "dark" | "light" }>,
): void {
  let count = 0;
  for (const config of configs) {
    const configName = `${config.viewport}-${config.theme}`;
    currentConfigPrefix = configName;
    console.log(
      `  📸 ${configName.toUpperCase()} (${VIEWPORTS[config.viewport].width}x${VIEWPORTS[config.viewport].height})`,
    );

    for (const pageId of DRY_RUN_PAGES) {
      const [prefix, ...rest] = pageId.split("-");
      const name = rest.join("-");
      if (!shouldCapture(prefix, name)) {
        continue;
      }
      const target = resolveCaptureTarget(prefix, name);
      const specInfo = target.specFolder ? `→ ${target.specFolder}/` : "→ e2e/screenshots/";
      console.log(`    [${prefix}] ${name}  ${specInfo}`);
      count++;
    }
    console.log("");
  }

  console.log(
    `  Total: ${count} screenshots would be captured across ${configs.length} config(s).\n`,
  );
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

  if (cliOptions.dryRun) {
    console.log("\n  🏃 DRY RUN — listing targets without launching a browser\n");
    dryRunEnumerate(selectedConfigs);
    return;
  }

  // Create staging directory only when we are actually capturing (not dry-run)
  fs.mkdirSync(SCREENSHOT_STAGING_BASE_DIR, { recursive: true });
  stagingRootDir = fs.mkdtempSync(path.join(SCREENSHOT_STAGING_BASE_DIR, "run-"));

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

  // -----------------------------------------------------------------------
  // Phase 1: Empty states — capture BEFORE seeding so pages are genuinely
  // empty. This eliminates the race condition where Convex syncs seeded
  // data before the empty-state screenshots can be captured.
  // -----------------------------------------------------------------------
  const hasEmptyCaptures = shouldCaptureAny("empty", [
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
    "meetings",
    "settings",
    "settings-profile",
  ]);

  if (hasEmptyCaptures) {
    console.log("\n  📋 Phase 1: Empty states (before seeding)");
    for (const config of selectedConfigs) {
      const browser = await launchBrowser();
      try {
        await captureEmptyForConfig(browser, config.viewport, config.theme, orgSlug);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isCrashLikeError(message)) {
          throw error;
        }
        captureFailures++;
        console.log(`    ⚠️ ${config.viewport}-${config.theme} empty capture failed: ${message}`);
      } finally {
        await browser.close();
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: Seed data, then capture public pages + filled states.
  // Public pages need seed data (invite tokens, portal tokens, etc.).
  // -----------------------------------------------------------------------
  console.log("\n  📋 Phase 2: Seed data + public pages + filled states");
  console.log("  Seeding screenshot data...");
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, { orgSlug });
  if (seedResult.success) {
    console.log(
      `  ✓ Seeded: org=${seedResult.orgSlug ?? orgSlug}, project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}`,
    );
  } else {
    console.log(`  ⚠️ Seed failed: ${seedResult.error} (continuing anyway)`);
  }

  for (const config of selectedConfigs) {
    let completed = false;
    for (let attempt = 1; attempt <= 2 && !completed; attempt++) {
      const browser = await launchBrowser();
      try {
        await captureFilledForConfig(browser, config.viewport, config.theme, orgSlug, seedResult);
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

  const skipNote = captureSkips > 0 ? ` (${captureSkips} skipped)` : "";
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ COMPLETE: ${totalScreenshots} screenshots captured${skipNote}`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("  Output:");
  for (const [folder, count] of outputSummary) {
    console.log(`    ${count.toString().padStart(3, " ")}  ${folder}`);
  }
  console.log("");
}

run().catch(console.error);
