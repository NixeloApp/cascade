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
  takeScreenshot,
} from "./screenshot-lib/capture";
import { parseCliOptions, printUsage } from "./screenshot-lib/cli";
import {
  BASE_URL,
  CONFIGS,
  SCREENSHOT_EMPTY_USER,
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
import { buildScreenshotShards } from "./screenshot-lib/sharding";
import { SCREENSHOT_PAGE_IDS } from "./screenshot-lib/targets";
import { injectAuthTokens } from "./utils/auth-helpers";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";
import { waitForDashboardReady } from "./utils/wait-helpers";

type ScreenshotCredentials = {
  email: string;
  password: string;
};

async function authenticateAndNavigateAs(
  page: Page,
  orgSlug: string,
  credentials: ScreenshotCredentials,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(`${BASE_URL}${ROUTES.signin.build()}`, { waitUntil: "load" });
    await testUserService.createTestUser(credentials.email, credentials.password, true);
    const loginResult = await testUserService.loginTestUserWithRepair(
      credentials.email,
      credentials.password,
      true,
    );
    if (!loginResult.success || !loginResult.token) {
      continue;
    }

    await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
    await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, { waitUntil: "load" });

    try {
      await page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON).waitFor({
        state: "visible",
        timeout: 30000,
      });
      await waitForSpinnersHidden(page, 10000);
      return true;
    } catch {
      try {
        await page.reload({ waitUntil: "load" });
        await page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON).waitFor({
          state: "visible",
          timeout: 20000,
        });
        await waitForSpinnersHidden(page, 10000);
        return true;
      } catch {
        if (attempt === 1) {
          return false;
        }
      }
    }
  }

  return false;
}

async function authenticateAndNavigate(page: Page, orgSlug: string): Promise<boolean> {
  return authenticateAndNavigateAs(page, orgSlug, SCREENSHOT_USER);
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

    if (shouldCapture("empty", "my-issues")) {
      const myIssuesContext = await browser.newContext({
        viewport: VIEWPORTS[viewport],
        colorScheme: theme,
        timezoneId: E2E_TIMEZONE,
      });
      const myIssuesPage = await myIssuesContext.newPage();

      try {
        if (!(await authenticateAndNavigateAs(myIssuesPage, orgSlug, SCREENSHOT_EMPTY_USER))) {
          throw new Error(
            `Auth failed for my-issues empty state in ${captureState.currentConfigPrefix}`,
          );
        }

        await takeScreenshot(myIssuesPage, "empty", "my-issues", ROUTES.myIssues.build(orgSlug));
      } finally {
        await myIssuesContext.close();
      }
    }
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

    for (const pageId of SCREENSHOT_PAGE_IDS) {
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

export async function run(): Promise<void> {
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
  if (captureState.cliOptions.shardIndex !== null && captureState.cliOptions.shardTotal !== null) {
    const shards = buildScreenshotShards(SCREENSHOT_PAGE_IDS, captureState.cliOptions.shardTotal);
    const activeShard = shards.find((shard) => shard.index === captureState.cliOptions.shardIndex);
    if (!activeShard) {
      throw new Error("Active screenshot shard could not be resolved");
    }
    console.log(
      `  Shard: ${activeShard.index}/${captureState.cliOptions.shardTotal} (${activeShard.targetCount} target(s), ${activeShard.keys.length} bucket(s))`,
    );
  }
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
  await testUserService.deleteTestUser(SCREENSHOT_EMPTY_USER.email);
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
