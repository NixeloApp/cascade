import * as fs from "node:fs";
import * as path from "node:path";
import type { Browser, BrowserContextOptions, Page, StorageState } from "@playwright/test";
import type { TestUser } from "../config";
import { E2E_TIMEZONE } from "../constants";
import { formatViewportThemeConfigLabel, runConfigMatrix } from "../utils/config-matrix";
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
  getPublicCaptureNames,
  getSelectedEmptyCaptureGroupsForNames,
  type PublicScreenshotCaptureGroup,
  type SelectedEmptyScreenshotCaptureGroup,
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

interface EmptyScreenshotCaptureGroupContext {
  browser: Browser;
  primaryPage?: Page;
}

export interface ScreenshotCaptureSessionOptions {
  runConfiguredStates?: RunConfiguredScreenshotStates;
  stagingBaseDir?: string;
}

export interface ScreenshotCapturePhasePlan {
  emptyCaptureNames: string[];
  filledCaptureNames: string[];
  selectedEmptyCaptureGroups: SelectedEmptyScreenshotCaptureGroup[];
  seededPublicCaptureNames: string[];
  seedlessPublicCaptureNames: string[];
  selectedPageIds: string[];
}

export interface ScreenshotCaptureExecutionPlan {
  executionSteps: ScreenshotCaptureExecutionStep[];
  phasePlan: ScreenshotCapturePhasePlan;
}

export interface FilledScreenshotCaptureOptions {
  includeSeededPublicPages?: boolean;
}

export interface ScreenshotEmptyPhaseBehavior {
  mode: EmptyScreenshotCaptureExecutionMode;
  requiresPrimaryBootstrap: boolean;
}

export interface ScreenshotSeededPhaseBehavior {
  captureFilledStates: boolean;
  includeSeededPublicPages: boolean;
  logLabel: string;
}

export type AuthenticatedScreenshotCapturePhase = "empty-state" | "filled-state";
export type EmptyScreenshotCaptureExecutionMode = "bootstrap-only" | "mixed" | "separate-auth-only";
export type ScreenshotCaptureExecutionContextRequirement =
  | "none"
  | "primary-user"
  | "authenticated-bootstrap";
export type ScreenshotSeededPhaseMode = "filled-only" | "public-and-filled" | "public-only";
export type ScreenshotCaptureExecutionStep =
  | {
      group: "seedless";
      kind: "public";
    }
  | {
      kind: "empty";
      mode: EmptyScreenshotCaptureExecutionMode;
      selectedGroups: SelectedEmptyScreenshotCaptureGroup[];
    }
  | {
      kind: "seeded";
      mode: ScreenshotSeededPhaseMode;
    };

export type ScreenshotCaptureExecutionContext =
  | {
      authBootstrap: ScreenshotAuthBootstrap;
    }
  | {
      authBootstrap: null;
      orgSlug: string;
    };

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

const EMPTY_CAPTURE_GROUP_AUTH_USERS = {
  bootstrap: null,
  "separate-auth": SCREENSHOT_EMPTY_AUTH_USER,
} as const satisfies Record<SelectedEmptyScreenshotCaptureGroup["group"], TestUser | null>;

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

    // Skip config-prefix filtering — this builds the run-wide plan before any
    // per-config loop sets currentConfigPrefix.
    return shouldCapture(prefix, rest.join("-"), { skipConfigFilter: true });
  });
}

export function buildScreenshotCapturePhasePlan(
  selectedPageIds: string[] = getSelectedScreenshotPageIds(),
): ScreenshotCapturePhasePlan {
  const seededPublicCaptureNameSet = new Set(getPublicCaptureNames("seeded"));
  const emptyCaptureNames = selectedPageIds.flatMap((pageId) => {
    const [prefix, ...rest] = pageId.split("-");
    if (prefix !== "empty" || rest.length === 0) {
      return [];
    }

    return [rest.join("-")];
  });
  const plan: ScreenshotCapturePhasePlan = {
    emptyCaptureNames,
    filledCaptureNames: [],
    selectedEmptyCaptureGroups: getSelectedEmptyCaptureGroupsForNames(emptyCaptureNames),
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

export function getEmptyScreenshotCaptureExecutionMode(
  selectedGroups: SelectedEmptyScreenshotCaptureGroup[],
): EmptyScreenshotCaptureExecutionMode {
  return getScreenshotEmptyPhaseBehavior(selectedGroups).mode;
}

export function getScreenshotEmptyPhaseBehavior(
  selectedGroups: SelectedEmptyScreenshotCaptureGroup[],
): ScreenshotEmptyPhaseBehavior {
  const selectedGroupNames = new Set(selectedGroups.map(({ group }) => group));
  if (selectedGroupNames.has("bootstrap") && selectedGroupNames.has("separate-auth")) {
    return {
      mode: "mixed",
      requiresPrimaryBootstrap: true,
    };
  }

  if (selectedGroupNames.has("bootstrap")) {
    return {
      mode: "bootstrap-only",
      requiresPrimaryBootstrap: true,
    };
  }

  return {
    mode: "separate-auth-only",
    requiresPrimaryBootstrap: false,
  };
}

export function buildScreenshotCaptureExecutionPlan(
  selectedPageIds: string[] = getSelectedScreenshotPageIds(),
): ScreenshotCaptureExecutionPlan {
  const phasePlan = buildScreenshotCapturePhasePlan(selectedPageIds);
  const executionSteps = buildScreenshotCaptureExecutionSteps(phasePlan);

  return {
    executionSteps,
    phasePlan,
  };
}

export function getScreenshotSeededPhaseMode(
  executionPlan: ScreenshotCaptureExecutionPlan,
): ScreenshotSeededPhaseMode | null {
  const seededStep = executionPlan.executionSteps.find(
    (executionStep) => executionStep.kind === "seeded",
  );
  return seededStep?.mode ?? null;
}

export function buildScreenshotCaptureExecutionSteps(
  phasePlan: ScreenshotCapturePhasePlan,
): ScreenshotCaptureExecutionStep[] {
  const executionSteps: ScreenshotCaptureExecutionStep[] = [];

  if (phasePlan.seedlessPublicCaptureNames.length > 0) {
    executionSteps.push({
      group: "seedless",
      kind: "public",
    });
  }

  if (phasePlan.emptyCaptureNames.length > 0) {
    const emptyPhaseBehavior = getScreenshotEmptyPhaseBehavior(
      phasePlan.selectedEmptyCaptureGroups,
    );
    executionSteps.push({
      kind: "empty",
      mode: emptyPhaseBehavior.mode,
      selectedGroups: phasePlan.selectedEmptyCaptureGroups,
    });
  }

  if (phasePlan.filledCaptureNames.length > 0 && phasePlan.seededPublicCaptureNames.length > 0) {
    executionSteps.push({
      kind: "seeded",
      mode: "public-and-filled",
    });
  } else if (phasePlan.filledCaptureNames.length > 0) {
    executionSteps.push({
      kind: "seeded",
      mode: "filled-only",
    });
  } else if (phasePlan.seededPublicCaptureNames.length > 0) {
    executionSteps.push({
      kind: "seeded",
      mode: "public-only",
    });
  }

  return executionSteps;
}

export function screenshotCaptureStepRequiresExecutionContext(
  executionStep: ScreenshotCaptureExecutionStep,
): boolean {
  return getScreenshotCaptureExecutionContextRequirement(executionStep) !== "none";
}

export function getScreenshotCaptureExecutionContextRequirement(
  executionStep: ScreenshotCaptureExecutionStep,
): ScreenshotCaptureExecutionContextRequirement {
  if (executionStep.kind === "public") {
    return "none";
  }

  if (executionStep.kind === "empty") {
    return getScreenshotEmptyPhaseBehavior(executionStep.selectedGroups).requiresPrimaryBootstrap
      ? "authenticated-bootstrap"
      : "primary-user";
  }

  if (executionStep.kind === "seeded") {
    return getScreenshotSeededPhaseBehavior(executionStep.mode).captureFilledStates
      ? "authenticated-bootstrap"
      : "primary-user";
  }

  return "authenticated-bootstrap";
}

export function emptyCaptureGroupRequiresPrimaryBootstrap(
  group: SelectedEmptyScreenshotCaptureGroup["group"],
): boolean {
  return EMPTY_CAPTURE_GROUP_AUTH_USERS[group] === null;
}

export function formatConfigLabel(viewport: ViewportName, theme: ThemeName): string {
  return formatViewportThemeConfigLabel({ theme, viewport });
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
        const orgSlug = await resolveScreenshotPrimaryUserOrgSlug();
        if (!orgSlug) {
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

export async function resolveScreenshotPrimaryUserOrgSlug(): Promise<string | null> {
  const orgResolution = await testUserService.resolveScreenshotOrgSlug(SCREENSHOT_USER.email);
  if (!orgResolution.orgSlug) {
    console.error(
      `  ❌ Could not determine screenshot org slug without seeding: ${orgResolution.error ?? "unknown error"}. Aborting.`,
    );
    return null;
  }

  return orgResolution.orgSlug;
}

export async function preparePrimaryUserScreenshotExecutionContext(): Promise<ScreenshotCaptureExecutionContext | null> {
  // Reset the separate-auth empty user so stale data from prior runs doesn't
  // leak into empty captures that authenticate as this user (e.g. my-issues).
  await testUserService.deleteTestUser(SCREENSHOT_EMPTY_USER.email);

  if (!(await prepareScreenshotPrimaryUser())) {
    return null;
  }

  const orgSlug = await resolveScreenshotPrimaryUserOrgSlug();
  if (!orgSlug) {
    return null;
  }

  return {
    authBootstrap: null,
    orgSlug,
  };
}

export async function prepareAuthenticatedScreenshotExecutionContext(
  launchBrowser: LaunchBrowser,
): Promise<ScreenshotCaptureExecutionContext | null> {
  await testUserService.deleteTestUser(SCREENSHOT_EMPTY_USER.email);
  const authBootstrap = await prepareScreenshotAuthBootstrap(launchBrowser);
  if (!authBootstrap) {
    return null;
  }

  return {
    authBootstrap,
  };
}

export async function prepareScreenshotCaptureExecutionContextForStep(
  launchBrowser: LaunchBrowser,
  executionStep: ScreenshotCaptureExecutionStep,
  executionContext: ScreenshotCaptureExecutionContext | null,
): Promise<ScreenshotCaptureExecutionContext | null> {
  const contextRequirement = getScreenshotCaptureExecutionContextRequirement(executionStep);
  if (contextRequirement === "none") {
    return executionContext;
  }

  if (contextRequirement === "primary-user") {
    return executionContext ?? preparePrimaryUserScreenshotExecutionContext();
  }

  if (executionContext?.authBootstrap) {
    return executionContext;
  }

  return prepareAuthenticatedScreenshotExecutionContext(launchBrowser);
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
  selectedEmptyCaptureGroups: SelectedEmptyScreenshotCaptureGroup[],
  storageState?: StorageState,
): Promise<void> {
  setCurrentConfig(viewport, theme, "empty");
  if (selectedEmptyCaptureGroups.length === 0) {
    return;
  }

  // Skip browser launch when no empty targets match this config.
  const emptyCaptureNames = selectedEmptyCaptureGroups.flatMap((g) => g.names);
  if (!shouldCaptureAny("empty", emptyCaptureNames)) {
    return;
  }

  try {
    const emptyPhaseBehavior = getScreenshotEmptyPhaseBehavior(selectedEmptyCaptureGroups);

    if (!emptyPhaseBehavior.requiresPrimaryBootstrap) {
      await withLaunchedBrowser(launchBrowser, async (browser) =>
        captureSelectedEmptyCaptureGroups(
          { browser },
          viewport,
          theme,
          orgSlug,
          selectedEmptyCaptureGroups,
        ),
      );
      return;
    }

    const authenticated = await runAuthenticatedScreenshotCapture(
      launchBrowser,
      viewport,
      theme,
      orgSlug,
      async ({ browser, page }) =>
        captureSelectedEmptyCaptureGroups(
          { browser, primaryPage: page },
          viewport,
          theme,
          orgSlug,
          selectedEmptyCaptureGroups,
        ),
      {
        storageState,
      },
    );

    if (!authenticated) {
      throw new Error(`Auth failed for ${captureState.currentConfigPrefix} empty states`);
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

export async function captureSelectedEmptyCaptureGroup(
  context: EmptyScreenshotCaptureGroupContext,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  selectedGroup: SelectedEmptyScreenshotCaptureGroup,
): Promise<void> {
  const authUser = EMPTY_CAPTURE_GROUP_AUTH_USERS[selectedGroup.group];

  if (!authUser) {
    if (!context.primaryPage) {
      throw new Error(
        `Empty capture group ${selectedGroup.group} requires the primary authenticated page`,
      );
    }

    await screenshotEmptyStates(context.primaryPage, orgSlug, { group: selectedGroup.group });
    return;
  }

  const authenticated = await withAuthenticatedScreenshotPage(
    context.browser,
    viewport,
    theme,
    orgSlug,
    async (page) => {
      await screenshotEmptyStates(page, orgSlug, { group: selectedGroup.group });
    },
    {
      user: authUser,
    },
  );

  if (!authenticated) {
    throw new Error(
      `Auth failed for ${selectedGroup.group} empty state in ${captureState.currentConfigPrefix}`,
    );
  }
}

export async function captureSelectedEmptyCaptureGroups(
  context: EmptyScreenshotCaptureGroupContext,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  selectedGroups: SelectedEmptyScreenshotCaptureGroup[],
): Promise<void> {
  for (const selectedGroup of selectedGroups) {
    await captureSelectedEmptyCaptureGroup(context, viewport, theme, orgSlug, selectedGroup);
  }
}

export async function captureFilledStatesForConfig(
  launchBrowser: LaunchBrowser,
  viewport: ViewportName,
  theme: ThemeName,
  orgSlug: string,
  seedResult: SeedScreenshotResult,
  storageState?: StorageState,
  options: FilledScreenshotCaptureOptions = {},
): Promise<void> {
  const includeSeededPublicPages = options.includeSeededPublicPages ?? true;

  setCurrentConfig(viewport, theme, includeSeededPublicPages ? "public + filled" : "filled");

  try {
    const authenticated = await runRetriedAuthenticatedScreenshotCapture(
      launchBrowser,
      viewport,
      theme,
      orgSlug,
      async ({ page }) => {
        if (includeSeededPublicPages) {
          await screenshotPublicPages(page, seedResult, { group: "seeded" });
        }

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
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureState.captureFailures++;
    console.log(`    ⚠️ Filled capture aborted for ${captureState.currentConfigPrefix}: ${message}`);
  }
}

export function getSeededPhaseLogLabel(executionPlan: ScreenshotCaptureExecutionPlan): string {
  const seededPhaseMode = getScreenshotSeededPhaseMode(executionPlan);
  if (!seededPhaseMode) {
    throw new Error("Seeded phase log label requires at least one seeded capture phase");
  }

  return getSeededPhaseLogLabelForMode(seededPhaseMode);
}

export function getSeededPhaseLogLabelForMode(seededPhaseMode: ScreenshotSeededPhaseMode): string {
  return getScreenshotSeededPhaseBehavior(seededPhaseMode).logLabel;
}

export function getScreenshotSeededPhaseBehavior(
  seededPhaseMode: ScreenshotSeededPhaseMode,
): ScreenshotSeededPhaseBehavior {
  if (seededPhaseMode === "public-and-filled") {
    return {
      captureFilledStates: true,
      includeSeededPublicPages: true,
      logLabel: "\n  📋 Phase 2: Seed data + public pages + filled states",
    };
  }

  if (seededPhaseMode === "filled-only") {
    return {
      captureFilledStates: true,
      includeSeededPublicPages: false,
      logLabel: "\n  📋 Phase 2: Seed data + filled states",
    };
  }

  return {
    captureFilledStates: false,
    includeSeededPublicPages: true,
    logLabel: "\n  📋 Phase 2: Seed data + token-backed public pages",
  };
}

export function getAuthenticatedScreenshotBootstrap(
  executionContext: ScreenshotCaptureExecutionContext,
  phase: AuthenticatedScreenshotCapturePhase,
): ScreenshotAuthBootstrap {
  if (!executionContext.authBootstrap) {
    throw new Error(`Authenticated bootstrap is required for screenshot ${phase} capture`);
  }

  return executionContext.authBootstrap;
}

export function getScreenshotExecutionOrgSlug(
  executionContext: ScreenshotCaptureExecutionContext,
): string {
  return executionContext.authBootstrap?.orgSlug ?? executionContext.orgSlug;
}

export async function runSeedlessPublicScreenshotPhase(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
): Promise<void> {
  console.log("\n  📋 Phase 0: Public pages (no seed required)");
  await runConfigMatrix(configs, async ({ config }) => {
    await capturePublicStatesForConfig(
      launchBrowser,
      config.viewport,
      config.theme,
      undefined,
      "seedless",
    );
  });
}

export async function runEmptyScreenshotPhase(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
  selectedEmptyCaptureGroups: SelectedEmptyScreenshotCaptureGroup[],
  executionContext: ScreenshotCaptureExecutionContext,
): Promise<void> {
  const emptyPhaseBehavior = getScreenshotEmptyPhaseBehavior(selectedEmptyCaptureGroups);
  const authStorageState = emptyPhaseBehavior.requiresPrimaryBootstrap
    ? getAuthenticatedScreenshotBootstrap(executionContext, "empty-state").authStorageState
    : undefined;
  const orgSlug = getScreenshotExecutionOrgSlug(executionContext);

  console.log("\n  📋 Phase 1: Empty states (before seeding)");
  await runConfigMatrix(configs, async ({ config, label }) => {
    try {
      await captureEmptyStatesForConfig(
        launchBrowser,
        config.viewport,
        config.theme,
        orgSlug,
        selectedEmptyCaptureGroups,
        authStorageState ?? undefined,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isCrashLikeError(message)) {
        throw error;
      }
      captureState.captureFailures++;
      console.log(`    ⚠️ ${label} empty capture failed: ${message}`);
    }
  });
}

export async function runSeededScreenshotPhase(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
  seededPhaseMode: ScreenshotSeededPhaseMode,
  executionContext: ScreenshotCaptureExecutionContext,
): Promise<void> {
  const seededPhaseBehavior = getScreenshotSeededPhaseBehavior(seededPhaseMode);

  console.log(seededPhaseBehavior.logLabel);
  console.log("  Seeding screenshot data...");
  const seedOrgSlug = getScreenshotExecutionOrgSlug(executionContext);
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, {
    orgSlug: seedOrgSlug,
  });
  if (!seedResult.success) {
    throw new Error(
      `Screenshot seeding failed: ${seedResult.error}. Cannot capture filled states with incomplete data.`,
    );
  }
  console.log(
    `  ✓ Seeded: org=${seedResult.orgSlug ?? seedOrgSlug ?? "unknown"}, project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}`,
  );

  if (seededPhaseBehavior.captureFilledStates) {
    const { authStorageState, orgSlug } = getAuthenticatedScreenshotBootstrap(
      executionContext,
      "filled-state",
    );

    await runConfigMatrix(configs, async ({ config }) => {
      await captureFilledStatesForConfig(
        launchBrowser,
        config.viewport,
        config.theme,
        orgSlug,
        seedResult,
        authStorageState ?? undefined,
        {
          includeSeededPublicPages: seededPhaseBehavior.includeSeededPublicPages,
        },
      );
    });
    return;
  }

  await runConfigMatrix(configs, async ({ config }) => {
    await capturePublicStatesForConfig(
      launchBrowser,
      config.viewport,
      config.theme,
      seedResult,
      "seeded",
    );
  });
}

export async function runScreenshotCaptureExecutionStep(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
  executionStep: ScreenshotCaptureExecutionStep,
  executionContext: ScreenshotCaptureExecutionContext | null,
): Promise<void> {
  if (executionStep.kind === "public") {
    await runSeedlessPublicScreenshotPhase(launchBrowser, configs);
    return;
  }

  if (!executionContext) {
    throw new Error(`Screenshot execution step ${executionStep.kind} requires execution context`);
  }

  if (executionStep.kind === "empty") {
    await runEmptyScreenshotPhase(
      launchBrowser,
      configs,
      executionStep.selectedGroups,
      executionContext,
    );
    return;
  }

  await runSeededScreenshotPhase(launchBrowser, configs, executionStep.mode, executionContext);
}

export async function captureConfiguredScreenshotStates(
  launchBrowser: LaunchBrowser,
  configs: ScreenshotCaptureConfig[],
): Promise<boolean> {
  const executionPlan = buildScreenshotCaptureExecutionPlan();
  const { executionSteps } = executionPlan;
  if (executionSteps.length === 0) {
    return true;
  }

  let executionContext: ScreenshotCaptureExecutionContext | null = null;
  for (const executionStep of executionSteps) {
    executionContext = await prepareScreenshotCaptureExecutionContextForStep(
      launchBrowser,
      executionStep,
      executionContext,
    );
    if (screenshotCaptureStepRequiresExecutionContext(executionStep) && !executionContext) {
      return false;
    }

    await runScreenshotCaptureExecutionStep(
      launchBrowser,
      configs,
      executionStep,
      executionContext,
    );
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
