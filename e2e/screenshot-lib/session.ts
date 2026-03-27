import * as fs from "node:fs";
import * as path from "node:path";
import type { Browser, BrowserContextOptions, Page, StorageState } from "@playwright/test";
import type { TestUser } from "../config";
import { E2E_TIMEZONE } from "../constants";
import { withBrowserPageTarget, withLaunchedBrowser } from "../utils/page-targets";
import { type SeedScreenshotResult, testUserService } from "../utils/test-user-service";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import {
  captureState,
  getStagedOutputSummary,
  isCrashLikeError,
  promoteStagedScreenshots,
  resetCounters,
  shouldCapture,
  shouldCaptureAny,
} from "./capture";
import {
  SCREENSHOT_AUTH_USER,
  SCREENSHOT_EMPTY_AUTH_USER,
  SCREENSHOT_EMPTY_USER,
  SCREENSHOT_STAGING_BASE_DIR,
  SCREENSHOT_USER,
  type ThemeName,
  VIEWPORTS,
  type ViewportName,
} from "./config";
import { screenshotFilledStates } from "./filled-states";
import {
  getEmptyCaptureNames,
  getPublicCaptureNames,
  type PublicScreenshotCaptureGroup,
  screenshotEmptyStates,
  screenshotPublicPages,
} from "./public-pages";
import { resolveCaptureTarget } from "./routing";
import { SCREENSHOT_PAGE_IDS } from "./targets";

export interface ScreenshotAuthBootstrap {
  authStorageState: StorageState | null;
  orgSlug: string;
}

export interface ScreenshotCaptureConfig {
  theme: ThemeName;
  viewport: ViewportName;
}

export interface ScreenshotCaptureRunResult {
  captureSkips: number;
  outputSummary: Map<string, number>;
  totalScreenshots: number;
}

export interface ScreenshotCapturePageContext {
  browser: Browser;
  page: Page;
}

export interface ScreenshotCaptureSessionOptions {
  runConfiguredStates?: RunConfiguredScreenshotStates;
  stagingBaseDir?: string;
}

export interface ScreenshotCapturePhasePlan {
  emptyCaptureNames: string[];
  filledCaptureNames: string[];
  seededPublicCaptureNames: string[];
  seedlessPublicCaptureNames: string[];
  selectedPageIds: string[];
}

export type LaunchBrowser = () => Promise<Browser>;
type ScreenshotPageCallback = (page: Page) => Promise<void>;
type AuthenticatedScreenshotPageOptions = {
  storageState?: StorageState;
  user?: TestUser;
};
type ScreenshotCapturePageCallback = (context: ScreenshotCapturePageContext) => Promise<void>;
type AuthenticatedScreenshotCaptureOptions = AuthenticatedScreenshotPageOptions & {
  maxAttempts?: number;
  onAttemptFailure?: (attempt: number, message: string, retrying: boolean) => void;
};
type RunConfiguredScreenshotStates = typeof captureConfiguredScreenshotStates;

export type ScreenshotCapturePhasePrefix = "empty" | "filled" | "public";

export function getCaptureNamesForPrefix(prefix: ScreenshotCapturePhasePrefix): string[] {
  return SCREENSHOT_PAGE_IDS.flatMap((pageId) => {
    const [pagePrefix, ...rest] = pageId.split("-");
    if (pagePrefix !== prefix || rest.length === 0) {
      return [];
    }

    return [rest.join("-")];
  });
}

export function getSelectedScreenshotPageIds(): string[] {
  return SCREENSHOT_PAGE_IDS.filter((pageId) => {
    const [prefix, ...rest] = pageId.split("-");
    if (rest.length === 0) {
      return false;
    }

    return shouldCapture(prefix, rest.join("-"));
  });
}

export function buildScreenshotCapturePhasePlan(
  selectedPageIds: string[] = getSelectedScreenshotPageIds(),
): ScreenshotCapturePhasePlan {
  const seededPublicCaptureNameSet = new Set(getPublicCaptureNames("seeded"));
  const plan: ScreenshotCapturePhasePlan = {
    emptyCaptureNames: [],
    filledCaptureNames: [],
    seededPublicCaptureNames: [],
    seedlessPublicCaptureNames: [],
    selectedPageIds,
  };

  for (const pageId of selectedPageIds) {
    const [prefix, ...rest] = pageId.split("-");
    if (rest.length === 0) {
      continue;
    }

    const name = rest.join("-");
    if (prefix === "empty") {
      plan.emptyCaptureNames.push(name);
      continue;
    }

    if (prefix === "filled") {
      plan.filledCaptureNames.push(name);
      continue;
    }

    if (prefix === "public") {
      if (seededPublicCaptureNameSet.has(name)) {
        plan.seededPublicCaptureNames.push(name);
      } else {
        plan.seedlessPublicCaptureNames.push(name);
      }
    }
  }

  return plan;
}

export function formatConfigLabel(viewport: ViewportName, theme: ThemeName): string {
  return `${viewport}-${theme}`;
}

export function setCurrentConfig(viewport: ViewportName, theme: ThemeName, mode: string): void {
  captureState.currentConfigPrefix = formatConfigLabel(viewport, theme);
  resetCounters();
  console.log(
    `\n  📸 ${captureState.currentConfigPrefix.toUpperCase()} (${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}) [${mode}]`,
  );
}

export function getScreenshotContextOptions(
  viewport: ViewportName,
  theme: ThemeName,
  storageState?: StorageState,
): BrowserContextOptions {
  return {
    viewport: VIEWPORTS[viewport],
    colorScheme: theme,
    timezoneId: E2E_TIMEZONE,
    ...(storageState ? { storageState } : {}),
  };
}

export function resetScreenshotCaptureSessionState(): void {
  captureState.captureFailures = 0;
  captureState.captureSkips = 0;
  captureState.currentConfigPrefix = "";
  captureState.stagingRootDir = "";
  captureState.totalScreenshots = 0;
  resetCounters();
}

export function initializeScreenshotStagingRoot(stagingBaseDir: string): void {
  fs.mkdirSync(stagingBaseDir, { recursive: true });
  captureState.stagingRootDir = fs.mkdtempSync(path.join(stagingBaseDir, "run-"));
}

export function cleanupScreenshotStagingRoot(): void {
  if (!captureState.stagingRootDir) {
    return;
  }

  fs.rmSync(captureState.stagingRootDir, { recursive: true, force: true });
  captureState.stagingRootDir = "";
}

export async function prepareScreenshotPrimaryUser(): Promise<boolean> {
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );

  if (!createResult.success) {
    console.error(`  ❌ Failed to create user: ${createResult.error}`);
    return false;
  }

  console.log(`  ✓ User: ${SCREENSHOT_USER.email}`);
  return true;
}

export async function withAuthenticatedScreenshotPage(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  callback: ScreenshotPageCallback,
  options: AuthenticatedScreenshotPageOptions = {},
): Promise<boolean> {
  let authenticated = false;

  await withBrowserPageTarget(
    browser,
    async ({ page }) => {
      authenticated = await ensureAuthenticatedScreenshotPage(
        page,
        orgSlug,
        options.user ?? SCREENSHOT_AUTH_USER,
      );

      if (!authenticated) {
        return false;
      }

      await callback(page);
      return true;
    },
    getScreenshotContextOptions(viewport, theme, options.storageState),
  );

  return authenticated;
}

export async function runAuthenticatedScreenshotCapture(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  callback: ScreenshotCapturePageCallback,
  options: AuthenticatedScreenshotCaptureOptions = {},
): Promise<boolean> {
  return withLaunchedBrowser(launchBrowser, async (browser) =>
    withAuthenticatedScreenshotPage(
      browser,
      viewport,
      theme,
      orgSlug,
      async (page) => callback({ browser, page }),
      options,
    ),
  );
}

export async function runRetriedAuthenticatedScreenshotCapture(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  callback: ScreenshotCapturePageCallback,
  options: AuthenticatedScreenshotCaptureOptions = {},
): Promise<boolean> {
  const maxAttempts = options.maxAttempts ?? 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runAuthenticatedScreenshotCapture(
        launchBrowser,
        viewport,
        theme,
        orgSlug,
        callback,
        options,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retrying = attempt < maxAttempts && isCrashLikeError(message);
      options.onAttemptFailure?.(attempt, message, retrying);

      if (!retrying) {
        throw error;
      }
    }
  }

  throw new Error("Retried screenshot capture exhausted all attempts unexpectedly");
}

export async function prepareScreenshotAuthBootstrap(
  launchBrowser: LaunchBrowser,
): Promise<ScreenshotAuthBootstrap | null> {
  console.log("\n  🔧 Setting up test data...");
  if (!(await prepareScreenshotPrimaryUser())) {
    return null;
  }

  return withLaunchedBrowser(launchBrowser, async (setupBrowser) =>
    withBrowserPageTarget(
      setupBrowser,
      async ({ context, page: setupPage }) => {
        const orgResolution = await testUserService.resolveScreenshotOrgSlug(SCREENSHOT_USER.email);
        const orgSlug = orgResolution.orgSlug;

        if (!orgSlug) {
          console.error(
            `  ❌ Could not determine screenshot org slug without seeding: ${orgResolution.error ?? "unknown error"}. Aborting.`,
          );
          return null;
        }

        if (!(await ensureAuthenticatedScreenshotPage(setupPage, orgSlug, SCREENSHOT_AUTH_USER))) {
          console.error("  ❌ Could not authenticate. Aborting.");
          return null;
        }

        return {
          orgSlug,
          authStorageState: await context.storageState(),
        };
      },
      getScreenshotContextOptions("desktop", "dark"),
    ),
  );
}

export async function capturePublicStatesForConfig(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  seed?: SeedScreenshotResult,
  group: PublicScreenshotCaptureGroup = "all",
): Promise<void> {
  setCurrentConfig(viewport, theme, "public");

  try {
    await withLaunchedBrowser(launchBrowser, async (browser) =>
      withBrowserPageTarget(
        browser,
        async ({ page }) => {
          await screenshotPublicPages(page, seed, { group });
        },
        getScreenshotContextOptions(viewport, theme),
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureState.captureFailures++;
    console.log(
      `    ⚠️ Public state capture failed for ${captureState.currentConfigPrefix}: ${message}`,
    );
  }
}

export async function captureEmptyStatesForConfig(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  storageState?: StorageState,
): Promise<void> {
  setCurrentConfig(viewport, theme, "empty");

  try {
    const authenticated = await runAuthenticatedScreenshotCapture(
      launchBrowser,
      viewport,
      theme,
      orgSlug,
      async ({ browser, page }) => {
        await screenshotEmptyStates(page, orgSlug);

        if (shouldCaptureAny("empty", getEmptyCaptureNames("separate-auth"))) {
          const myIssuesAuthenticated = await withAuthenticatedScreenshotPage(
            browser,
            viewport,
            theme,
            orgSlug,
            async (myIssuesPage) => {
              await screenshotEmptyStates(myIssuesPage, orgSlug, { group: "separate-auth" });
            },
            {
              user: SCREENSHOT_EMPTY_AUTH_USER,
            },
          );

          if (!myIssuesAuthenticated) {
            throw new Error(
              `Auth failed for my-issues empty state in ${captureState.currentConfigPrefix}`,
            );
          }
        }
      },
      {
        storageState,
      },
    );

    if (!authenticated) {
      captureState.captureFailures++;
      console.log(`    ⚠️ Auth failed for ${captureState.currentConfigPrefix} empty states`);
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
  }
}

export async function captureFilledStatesForConfig(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  seedResult: SeedScreenshotResult,
  storageState?: StorageState,
): Promise<void> {
  setCurrentConfig(viewport, theme, "public + filled");

  try {
    const authenticated = await runRetriedAuthenticatedScreenshotCapture(
      launchBrowser,
      viewport,
      theme,
      orgSlug,
      async ({ page }) => {
        await screenshotPublicPages(page, seedResult, { group: "seeded" });

        try {
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
        }
      },
      {
        maxAttempts: 2,
        onAttemptFailure: (attempt, message, retrying) => {
          console.log(
            `    ⚠️ ${viewport}-${theme} failed on attempt ${attempt}: ${message}${retrying ? " (retrying)" : ""}`,
          );
        },
        storageState,
      },
    );

    if (!authenticated) {
      throw new Error(`Auth failed for ${captureState.currentConfigPrefix} filled states`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    captureState.captureFailures++;
    console.log(`    ⚠️ Filled capture aborted for ${captureState.currentConfigPrefix}: ${message}`);
  }
}

export async function captureConfiguredScreenshotStates(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
): Promise<boolean> {
  const phasePlan = buildScreenshotCapturePhasePlan();
  const hasSeedlessPublicTargets = phasePlan.seedlessPublicCaptureNames.length > 0;
  const hasSeededPublicTargets = phasePlan.seededPublicCaptureNames.length > 0;
  const hasEmptyTargets = phasePlan.emptyCaptureNames.length > 0;
  const hasFilledTargets = phasePlan.filledCaptureNames.length > 0;
  const needsAuthBootstrap = hasEmptyTargets || hasFilledTargets;
  const hasSeededTargets = hasSeededPublicTargets || hasFilledTargets;

  if (hasSeedlessPublicTargets) {
    console.log("\n  📋 Phase 0: Public pages (no seed required)");
    for (const config of configs) {
      await capturePublicStatesForConfig(
        launchBrowser,
        config.viewport,
        config.theme,
        undefined,
        "seedless",
      );
    }
  }

  if (!hasEmptyTargets && !hasSeededTargets) {
    return true;
  }

  let authBootstrap: ScreenshotAuthBootstrap | null = null;
  if (needsAuthBootstrap) {
    await testUserService.deleteTestUser(SCREENSHOT_EMPTY_USER.email);

    authBootstrap = await prepareScreenshotAuthBootstrap(launchBrowser);
    if (!authBootstrap) {
      return false;
    }
  } else if (!(await prepareScreenshotPrimaryUser())) {
    return false;
  }

  if (hasEmptyTargets) {
    const { authStorageState, orgSlug } = authBootstrap as ScreenshotAuthBootstrap;
    console.log("\n  📋 Phase 1: Empty states (before seeding)");
    for (const config of configs) {
      try {
        await captureEmptyStatesForConfig(
          launchBrowser,
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
      }
    }
  }

  if (!hasSeededTargets) {
    return true;
  }

  console.log(
    hasFilledTargets
      ? "\n  📋 Phase 2: Seed data + public pages + filled states"
      : "\n  📋 Phase 2: Seed data + token-backed public pages",
  );
  console.log("  Seeding screenshot data...");
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, {
    orgSlug: authBootstrap?.orgSlug,
  });
  if (seedResult.success) {
    console.log(
      `  ✓ Seeded: org=${seedResult.orgSlug ?? authBootstrap?.orgSlug ?? "unknown"}, project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}`,
    );
  } else {
    console.log(`  ⚠️ Seed failed: ${seedResult.error} (continuing anyway)`);
  }

  if (hasFilledTargets) {
    const { authStorageState, orgSlug } = authBootstrap as ScreenshotAuthBootstrap;
    for (const config of configs) {
      await captureFilledStatesForConfig(
        launchBrowser,
        config.viewport,
        config.theme,
        orgSlug,
        seedResult,
        authStorageState ?? undefined,
      );
    }
  } else {
    for (const config of configs) {
      await capturePublicStatesForConfig(
        launchBrowser,
        config.viewport,
        config.theme,
        seedResult,
        "seeded",
      );
    }
  }

  return true;
}

export async function runConfiguredScreenshotCaptureSession(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
  options: ScreenshotCaptureSessionOptions = {},
): Promise<ScreenshotCaptureRunResult | null> {
  resetScreenshotCaptureSessionState();
  initializeScreenshotStagingRoot(options.stagingBaseDir ?? SCREENSHOT_STAGING_BASE_DIR);

  try {
    const captured = await (options.runConfiguredStates ?? captureConfiguredScreenshotStates)(
      launchBrowser,
      configs,
    );
    if (!captured) {
      return null;
    }

    if (captureState.captureFailures > 0) {
      throw new Error(
        `Screenshot capture had ${captureState.captureFailures} failure(s); staged output was not promoted`,
      );
    }

    if (captureState.totalScreenshots === 0) {
      throw new Error("No screenshots matched the provided filters");
    }

    const outputSummary = getStagedOutputSummary();
    promoteStagedScreenshots();

    return {
      captureSkips: captureState.captureSkips,
      outputSummary,
      totalScreenshots: captureState.totalScreenshots,
    };
  } finally {
    cleanupScreenshotStagingRoot();
  }
}

export function enumerateDryRunTargets(configs: ScreenshotCaptureConfig[]): void {
  let count = 0;
  for (const config of configs) {
    captureState.currentConfigPrefix = formatConfigLabel(config.viewport, config.theme);
    console.log(
      `  📸 ${captureState.currentConfigPrefix.toUpperCase()} (${VIEWPORTS[config.viewport].width}x${VIEWPORTS[config.viewport].height})`,
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
