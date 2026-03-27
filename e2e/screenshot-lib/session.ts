import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
  StorageState,
} from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import type { TestUser } from "../config";
import { E2E_TIMEZONE } from "../constants";
import { type SeedScreenshotResult, testUserService } from "../utils/test-user-service";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import {
  captureState,
  isCrashLikeError,
  resetCounters,
  shouldCapture,
  shouldCaptureAny,
  takeScreenshot,
} from "./capture";
import {
  SCREENSHOT_AUTH_USER,
  SCREENSHOT_EMPTY_AUTH_USER,
  SCREENSHOT_EMPTY_USER,
  SCREENSHOT_USER,
  type ThemeName,
  VIEWPORTS,
  type ViewportName,
} from "./config";
import { screenshotFilledStates } from "./filled-states";
import { screenshotEmptyStates, screenshotPublicPages } from "./public-pages";
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

export type LaunchBrowser = () => Promise<Browser>;
export type ScreenshotPageTarget = {
  context: BrowserContext;
  page: Page;
};
type ScreenshotPageCallback = (page: Page) => Promise<void>;
type ScreenshotPageTargetCallback<T> = (target: ScreenshotPageTarget) => Promise<T>;
type AuthenticatedScreenshotPageOptions = {
  storageState?: StorageState;
  user?: TestUser;
};

const EMPTY_CAPTURE_NAMES = [
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
] as const;

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

export function getContextOptions(
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

export async function withLaunchedBrowser<T>(
  launchBrowser: LaunchBrowser,
  callback: (browser: Browser) => Promise<T>,
): Promise<T> {
  const browser = await launchBrowser();
  try {
    return await callback(browser);
  } finally {
    await browser.close();
  }
}

export async function withScreenshotTarget<T>(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  callback: ScreenshotPageTargetCallback<T>,
  storageState?: StorageState,
): Promise<T> {
  const context = await browser.newContext(getContextOptions(viewport, theme, storageState));

  try {
    const page = await context.newPage();
    return await callback({ context, page });
  } finally {
    await context.close();
  }
}

export async function withScreenshotPage(
  browser: Browser,
  viewport: ViewportName,
  theme: ThemeName,
  callback: ScreenshotPageCallback,
  storageState?: StorageState,
): Promise<void> {
  await withScreenshotTarget(
    browser,
    viewport,
    theme,
    async ({ page }) => {
      await callback(page);
    },
    storageState,
  );
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

  await withScreenshotTarget(
    browser,
    viewport,
    theme,
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
    options.storageState,
  );

  return authenticated;
}

export async function prepareScreenshotAuthBootstrap(
  launchBrowser: LaunchBrowser,
): Promise<ScreenshotAuthBootstrap | null> {
  console.log("\n  🔧 Setting up test data...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );

  if (!createResult.success) {
    console.error(`  ❌ Failed to create user: ${createResult.error}`);
    return null;
  }

  console.log(`  ✓ User: ${SCREENSHOT_USER.email}`);

  return withLaunchedBrowser(launchBrowser, async (setupBrowser) =>
    withScreenshotTarget(setupBrowser, "desktop", "dark", async ({ context, page: setupPage }) => {
      const seedProbe = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, {});
      const orgSlug = seedProbe.orgSlug;

      if (!orgSlug) {
        console.error("  ❌ Could not determine org slug from seed probe. Aborting.");
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
    }),
  );
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
    await withLaunchedBrowser(launchBrowser, async (browser) => {
      const authenticated = await withAuthenticatedScreenshotPage(
        browser,
        viewport,
        theme,
        orgSlug,
        async (page) => {
          await screenshotEmptyStates(page, orgSlug);

          if (shouldCapture("empty", "my-issues")) {
            const myIssuesAuthenticated = await withAuthenticatedScreenshotPage(
              browser,
              viewport,
              theme,
              orgSlug,
              async (myIssuesPage) => {
                await takeScreenshot(
                  myIssuesPage,
                  "empty",
                  "my-issues",
                  ROUTES.myIssues.build(orgSlug),
                );
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
    });
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

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await withLaunchedBrowser(launchBrowser, async (browser) => {
        const authenticated = await withAuthenticatedScreenshotPage(
          browser,
          viewport,
          theme,
          orgSlug,
          async (page) => {
            await screenshotPublicPages(page, seedResult);

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
            storageState,
          },
        );

        if (!authenticated) {
          throw new Error(`Auth failed for ${captureState.currentConfigPrefix} filled states`);
        }
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldRetry = attempt < 2 && isCrashLikeError(message);
      console.log(
        `    ⚠️ ${viewport}-${theme} failed on attempt ${attempt}: ${message}${shouldRetry ? " (retrying)" : ""}`,
      );

      if (shouldRetry) {
        continue;
      }

      captureState.captureFailures++;
      return;
    }
  }
}

export async function captureConfiguredScreenshotStates(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
): Promise<boolean> {
  await testUserService.deleteTestUser(SCREENSHOT_EMPTY_USER.email);

  const authBootstrap = await prepareScreenshotAuthBootstrap(launchBrowser);
  if (!authBootstrap) {
    return false;
  }

  const { authStorageState, orgSlug } = authBootstrap;

  if (shouldCaptureAny("empty", [...EMPTY_CAPTURE_NAMES])) {
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

  return true;
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
