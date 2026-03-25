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
import { type Browser, chromium, type Page } from "@playwright/test";
import { ROUTES } from "../convex/shared/routes";
import { TEST_IDS } from "../src/lib/test-ids";
import { E2E_TIMEZONE } from "./constants";
import {
  captureState,
  getStagedOutputSummary,
  getStagingRoot,
  isConfigSelected,
  isCrashLikeError,
  promoteStagedScreenshots,
  registerWaitForExpectedContent,
  resetCounters,
  shouldCapture,
  shouldCaptureAny,
} from "./screenshot-lib/capture";
import { parseCliOptions, printUsage } from "./screenshot-lib/cli";
import {
  BASE_URL,
  CONFIGS,
  SCREENSHOT_STAGING_BASE_DIR,
  SCREENSHOT_USER,
  VIEWPORTS,
  type ViewportName,
} from "./screenshot-lib/config";
import { screenshotFilledStates } from "./screenshot-lib/filled-states";
import { autoLogin } from "./screenshot-lib/helpers";
import { screenshotEmptyStates, screenshotPublicPages } from "./screenshot-lib/public-pages";
import { waitForExpectedContent, waitForSpinnersHidden } from "./screenshot-lib/readiness";
import { getGeneratedSpecFolders, resolveCaptureTarget } from "./screenshot-lib/routing";
import { injectAuthTokens } from "./utils/auth-helpers";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";
import { waitForDashboardReady } from "./utils/wait-helpers";

async function authenticateAndNavigate(page: Page, orgSlug: string): Promise<boolean> {
  // Navigate to sign-in page and inject tokens
  await page.goto(`${BASE_URL}${ROUTES.signin.build()}`, { waitUntil: "load" });
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );
  if (!loginResult.success || !loginResult.token) return false;

  await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);

  // Navigate to dashboard and wait for Convex to pick up tokens.
  // The reload() is critical — it forces ConvexReactClient to re-initialize
  // and read the JWT from localStorage during its constructor, which is the
  // only reliable way to establish auth in a fresh browser context.
  await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, { waitUntil: "load" });

  // Wait for Convex WebSocket to connect and auth to settle.
  // Check for the search button (rendered by the app shell after auth).
  try {
    await page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON).waitFor({
      state: "visible",
      timeout: 30000,
    });
  } catch {
    // If search button doesn't appear, auth may not have settled.
    // Reload once more to retry auth initialization.
    await page.reload({ waitUntil: "load" });
    await page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON).waitFor({
      state: "visible",
      timeout: 20000,
    });
  }

  await waitForSpinnersHidden(page, 10000);
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
  storageState?: { cookies: unknown[]; origins: unknown[] },
): Promise<void> {
  captureState.currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${captureState.currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}) [empty]`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
    ...(storageState ? { storageState } : {}),
  });
  const page = await context.newPage();

  try {
    if (storageState) {
      const dashboardUrl = `${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`;
      try {
        await page.goto(dashboardUrl, { waitUntil: "load" });
        await waitForDashboardReady(page);
      } catch {
        await page.reload({ waitUntil: "load" });
        await waitForDashboardReady(page);
      }
    } else if (!(await authenticateAndNavigate(page, orgSlug))) {
      captureState.captureFailures++;
      console.log(`    ⚠️ Auth failed for ${captureState.currentConfigPrefix} empty states`);
      return;
    }
    await screenshotEmptyStates(page, orgSlug);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureState.captureFailures++;
    console.log(
      `    ⚠️ Empty state capture failed for ${captureState.currentConfigPrefix}: ${message}`,
    );
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
  storageState?: { cookies: unknown[]; origins: unknown[] },
): Promise<void> {
  captureState.currentConfigPrefix = `${viewport}-${theme}`;
  resetCounters();

  console.log(
    `\n  📸 ${captureState.currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}) [public + filled]`,
  );

  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
    ...(storageState ? { storageState } : {}),
  });
  const page = await context.newPage();

  // Public pages (no auth needed, but some need seed data for tokens)
  await screenshotPublicPages(page, seedResult);

  try {
    // Re-authenticate per filled-state config instead of relying solely on the
    // setup-time storage snapshot. The screenshot run spans multiple fresh
    // browser contexts, and re-establishing auth here is more deterministic
    // for route-level captures than reusing a potentially stale token snapshot.
    if (!(await authenticateAndNavigate(page, orgSlug))) {
      captureState.captureFailures++;
      console.log(`    ⚠️ Auth failed for ${captureState.currentConfigPrefix} filled states`);
      return;
    }

    const filledOrgSlug = seedResult.orgSlug ?? orgSlug;
    await screenshotFilledStates(page, filledOrgSlug, seedResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureState.captureFailures++;
    console.log(
      `    ⚠️ Filled state capture failed for ${captureState.currentConfigPrefix}: ${message}`,
    );
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
  "empty-outreach",
  "empty-settings",
  "empty-settings-profile",
  // Filled states — top-level
  "filled-dashboard",
  "filled-projects",
  "filled-issues",
  "filled-documents",
  "filled-documents-templates",
  "filled-documents-search-filtered",
  "filled-documents-search-empty",
  "filled-workspaces",
  "filled-workspaces-search-empty",
  "filled-time-tracking",
  "filled-notifications",
  "filled-my-issues-filter-active",
  "filled-my-issues-filtered-empty",
  "filled-my-issues-loading",
  "filled-my-issues",
  "filled-org-calendar",
  "filled-org-analytics",
  "filled-invoices",
  "filled-clients",
  "filled-meetings",
  "filled-outreach",
  "filled-outreach-sequences",
  "filled-outreach-contacts",
  "filled-outreach-mailboxes",
  "filled-outreach-analytics",
  "filled-outreach-contact-dialog",
  "filled-outreach-import-dialog",
  "filled-outreach-sequence-dialog",
  "filled-outreach-enroll-dialog",
  "filled-outreach-mailbox-disconnect-confirm",
  "filled-meetings-detail",
  "filled-meetings-transcript-search",
  "filled-meetings-memory-lens",
  "filled-meetings-processing",
  "filled-meetings-filter-empty",
  "filled-meetings-schedule-dialog",
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
  "filled-issues-search-filtered",
  "filled-issues-search-empty",
  "filled-issues-filter-active",
  "filled-issues-create-modal",
  "filled-issues-loading",
  // Filled states — workspace modals
  "filled-workspaces-create-workspace-modal",
  "filled-workspace-create-team-modal",
  // Filled states — project sub-pages (use PROJ as placeholder key)
  "filled-project-PROJ-board",
  "filled-project-PROJ-backlog",
  "filled-project-PROJ-inbox",
  "filled-project-PROJ-inbox-closed",
  "filled-project-PROJ-inbox-bulk-selection",
  "filled-project-PROJ-inbox-snooze-menu",
  "filled-project-PROJ-inbox-decline-dialog",
  "filled-project-PROJ-inbox-duplicate-dialog",
  "filled-project-PROJ-inbox-open-empty",
  "filled-project-PROJ-inbox-closed-empty",
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
  "filled-notifications-inbox-empty",
  "filled-notifications-archived-empty",
  "filled-notifications-mark-all-read-loading",
  "filled-notifications-unread-overflow",
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
    captureState.currentConfigPrefix = configName;
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
  captureState.cliOptions = parseCliOptions(process.argv.slice(2));
  registerWaitForExpectedContent(waitForExpectedContent);
  if (captureState.cliOptions.help) {
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
  if (captureState.cliOptions.specFilters.length > 0) {
    console.log(`  Spec filter: ${captureState.cliOptions.specFilters.join(", ")}`);
  }
  if (captureState.cliOptions.matchFilters.length > 0) {
    console.log(`  Match filter: ${captureState.cliOptions.matchFilters.join(", ")}`);
  }

  if (captureState.cliOptions.dryRun) {
    console.log("\n  🏃 DRY RUN — listing targets without launching a browser\n");
    dryRunEnumerate(selectedConfigs);
    return;
  }

  // Create staging directory only when we are actually capturing (not dry-run)
  fs.mkdirSync(SCREENSHOT_STAGING_BASE_DIR, { recursive: true });
  captureState.stagingRootDir = fs.mkdtempSync(path.join(SCREENSHOT_STAGING_BASE_DIR, "run-"));

  const headless = captureState.cliOptions.headless;
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
  // Capture the authenticated storage state so per-config contexts can reuse it
  const authStorageState = orgSlug ? await setupContext.storageState() : null;
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
        await captureEmptyForConfig(
          browser,
          config.viewport,
          config.theme,
          orgSlug,
          authStorageState ?? undefined,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isCrashLikeError(message)) {
          throw error;
        }
        captureState.captureFailures++;
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
        await captureFilledForConfig(
          browser,
          config.viewport,
          config.theme,
          orgSlug,
          seedResult,
          authStorageState ?? undefined,
        );
        completed = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const shouldRetry = attempt < 2 && isCrashLikeError(message);
        console.log(
          `    ⚠️ ${config.viewport}-${config.theme} failed on attempt ${attempt}: ${message}${shouldRetry ? " (retrying)" : ""}`,
        );
        if (!shouldRetry) {
          captureState.captureFailures++;
          break;
        }
      } finally {
        await browser.close();
      }
    }
  }

  if (captureState.captureFailures > 0) {
    fs.rmSync(getStagingRoot(), { recursive: true, force: true });
    captureState.stagingRootDir = "";
    throw new Error(
      `Screenshot capture had ${captureState.captureFailures} failure(s); staged output was not promoted`,
    );
  }

  if (captureState.totalScreenshots === 0) {
    fs.rmSync(getStagingRoot(), { recursive: true, force: true });
    captureState.stagingRootDir = "";
    throw new Error("No screenshots matched the provided filters");
  }

  promoteStagedScreenshots();
  const outputSummary = getStagedOutputSummary();
  fs.rmSync(getStagingRoot(), { recursive: true, force: true });
  captureState.stagingRootDir = "";

  const skipNote = captureState.captureSkips > 0 ? ` (${captureState.captureSkips} skipped)` : "";
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ COMPLETE: ${captureState.totalScreenshots} screenshots captured${skipNote}`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("  Output:");
  for (const [folder, count] of outputSummary) {
    console.log(`    ${count.toString().padStart(3, " ")}  ${folder}`);
  }
  console.log("");
}

run().catch(console.error);
