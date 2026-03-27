import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { E2E_TIMEZONE } from "../constants";
import { testUserService } from "../utils/test-user-service";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import * as captureModule from "./capture";
import { captureState } from "./capture";
import { screenshotFilledStates } from "./filled-states";
import { screenshotEmptyStates, screenshotPublicPages } from "./public-pages";
import {
  buildScreenshotCaptureExecutionPlan,
  buildScreenshotCapturePhasePlan,
  captureConfiguredScreenshotStates,
  captureFilledStatesForConfig,
  enumerateDryRunTargets,
  formatConfigLabel,
  getAuthenticatedScreenshotBootstrap,
  getCaptureNamesForPrefix,
  getScreenshotContextOptions,
  getSeededPhaseLogLabel,
  getSelectedScreenshotPageIds,
  prepareScreenshotAuthBootstrap,
  prepareScreenshotCaptureExecutionContext,
  runAuthenticatedScreenshotCapture,
  runConfiguredScreenshotCaptureSession,
  runEmptyScreenshotPhase,
  runRetriedAuthenticatedScreenshotCapture,
  runSeededScreenshotPhase,
  runSeedlessPublicScreenshotPhase,
  withAuthenticatedScreenshotPage,
} from "./session";

vi.mock("./auth", () => ({
  ensureAuthenticatedScreenshotPage: vi.fn(),
}));

vi.mock("./filled-states", () => ({
  screenshotFilledStates: vi.fn(),
}));

vi.mock("./public-pages", () => ({
  getEmptyCaptureNames: vi.fn((group: "all" | "bootstrap" | "separate-auth" = "all") => {
    const bootstrap = [
      "dashboard",
      "projects",
      "issues",
      "documents",
      "documents-templates",
      "workspaces",
      "time-tracking",
      "notifications",
      "invoices",
      "clients",
      "meetings",
      "outreach",
      "settings",
      "settings-profile",
    ];
    const separateAuth = ["my-issues"];
    if (group === "bootstrap") {
      return bootstrap;
    }
    if (group === "separate-auth") {
      return separateAuth;
    }
    return [...bootstrap, ...separateAuth];
  }),
  getPublicCaptureNames: vi.fn((group: "all" | "seeded" | "seedless" = "all") => {
    const seedless = [
      "landing",
      "signin",
      "signup",
      "signup-verify",
      "forgot-password",
      "forgot-password-reset",
      "verify-email",
      "verify-2fa",
      "invite-invalid",
      "invite-expired",
      "invite-revoked",
      "invite-accepted",
    ];
    const seeded = ["invite", "unsubscribe", "portal", "portal-project"];
    if (group === "seedless") {
      return seedless;
    }
    if (group === "seeded") {
      return seeded;
    }
    return [...seedless, ...seeded];
  }),
  screenshotEmptyStates: vi.fn(),
  screenshotPublicPages: vi.fn(),
}));

describe("screenshot session helpers", () => {
  const createBrowserHarness = () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    const context = {
      close: vi.fn(async () => {}),
      newPage: vi.fn(async () => page),
      storageState: vi.fn(async () => ({ cookies: [], origins: [] })),
    } as BrowserContext;
    const browser = {
      close: vi.fn(async () => {}),
      newContext: vi.fn(async () => context),
    } as Browser;

    return { browser, context, page };
  };

  afterEach(() => {
    captureState.captureFailures = 0;
    captureState.captureSkips = 0;
    captureState.currentConfigPrefix = "";
    captureState.stagingRootDir = "";
    captureState.totalScreenshots = 0;
    captureState.cliOptions = {
      headless: true,
      dryRun: false,
      configFilters: null,
      specFilters: [],
      matchFilters: [],
      shardIndex: null,
      shardTotal: null,
      help: false,
    };
    vi.restoreAllMocks();
  });

  it("formats viewport and theme pairs into config labels", () => {
    expect(formatConfigLabel("desktop", "dark")).toBe("desktop-dark");
    expect(formatConfigLabel("mobile", "light")).toBe("mobile-light");
  });

  it("builds screenshot context options from viewport, theme, and storage state", () => {
    expect(
      getScreenshotContextOptions("tablet", "light", {
        cookies: [],
        origins: [],
      }),
    ).toEqual({
      colorScheme: "light",
      storageState: { cookies: [], origins: [] },
      timezoneId: E2E_TIMEZONE,
      viewport: { height: 1024, width: 768 },
    });
  });

  it("derives capture names from the canonical page id list for each phase prefix", () => {
    expect(getCaptureNamesForPrefix("empty")).toContain("outreach");
    expect(getCaptureNamesForPrefix("public")).toContain("landing");
    expect(getCaptureNamesForPrefix("filled")).toContain("issues-loading");
  });

  it("builds a screenshot phase plan directly from canonical page ids", () => {
    expect(buildScreenshotCapturePhasePlan(["public-landing"])).toEqual({
      emptyCaptureNames: [],
      filledCaptureNames: [],
      seededPublicCaptureNames: [],
      seedlessPublicCaptureNames: ["landing"],
      selectedPageIds: ["public-landing"],
    });
    expect(buildScreenshotCapturePhasePlan(["public-portal-project"])).toEqual({
      emptyCaptureNames: [],
      filledCaptureNames: [],
      seededPublicCaptureNames: ["portal-project"],
      seedlessPublicCaptureNames: [],
      selectedPageIds: ["public-portal-project"],
    });
    expect(buildScreenshotCapturePhasePlan(["empty-dashboard"])).toEqual({
      emptyCaptureNames: ["dashboard"],
      filledCaptureNames: [],
      seededPublicCaptureNames: [],
      seedlessPublicCaptureNames: [],
      selectedPageIds: ["empty-dashboard"],
    });
    expect(buildScreenshotCapturePhasePlan(["filled-issues-loading"])).toEqual({
      emptyCaptureNames: [],
      filledCaptureNames: ["issues-loading"],
      seededPublicCaptureNames: [],
      seedlessPublicCaptureNames: [],
      selectedPageIds: ["filled-issues-loading"],
    });
  });

  it("builds one execution plan for bootstrap and seeded-phase policy", () => {
    expect(buildScreenshotCaptureExecutionPlan(["public-landing"])).toEqual({
      bootstrapMode: "none",
      phasePlan: {
        emptyCaptureNames: [],
        filledCaptureNames: [],
        seededPublicCaptureNames: [],
        seedlessPublicCaptureNames: ["landing"],
        selectedPageIds: ["public-landing"],
      },
      runEmptyPhase: false,
      runFilledPhase: false,
      runSeededPhase: false,
      runSeededPublicPhase: false,
      runSeedlessPublicPhase: true,
    });

    expect(buildScreenshotCaptureExecutionPlan(["public-portal-project"])).toEqual({
      bootstrapMode: "primary-user",
      phasePlan: {
        emptyCaptureNames: [],
        filledCaptureNames: [],
        seededPublicCaptureNames: ["portal-project"],
        seedlessPublicCaptureNames: [],
        selectedPageIds: ["public-portal-project"],
      },
      runEmptyPhase: false,
      runFilledPhase: false,
      runSeededPhase: true,
      runSeededPublicPhase: true,
      runSeedlessPublicPhase: false,
    });

    expect(buildScreenshotCaptureExecutionPlan(["empty-dashboard"])).toEqual({
      bootstrapMode: "authenticated",
      phasePlan: {
        emptyCaptureNames: ["dashboard"],
        filledCaptureNames: [],
        seededPublicCaptureNames: [],
        seedlessPublicCaptureNames: [],
        selectedPageIds: ["empty-dashboard"],
      },
      runEmptyPhase: true,
      runFilledPhase: false,
      runSeededPhase: false,
      runSeededPublicPhase: false,
      runSeedlessPublicPhase: false,
    });

    expect(buildScreenshotCaptureExecutionPlan(["filled-issues-loading"])).toEqual({
      bootstrapMode: "authenticated",
      phasePlan: {
        emptyCaptureNames: [],
        filledCaptureNames: ["issues-loading"],
        seededPublicCaptureNames: [],
        seedlessPublicCaptureNames: [],
        selectedPageIds: ["filled-issues-loading"],
      },
      runEmptyPhase: false,
      runFilledPhase: true,
      runSeededPhase: true,
      runSeededPublicPhase: false,
      runSeedlessPublicPhase: false,
    });
  });

  it("derives the seeded phase log label from the execution plan", () => {
    expect(
      getSeededPhaseLogLabel(buildScreenshotCaptureExecutionPlan(["public-portal-project"])),
    ).toBe("\n  📋 Phase 2: Seed data + token-backed public pages");
    expect(
      getSeededPhaseLogLabel(buildScreenshotCaptureExecutionPlan(["filled-issues-loading"])),
    ).toBe("\n  📋 Phase 2: Seed data + filled states");
    expect(
      getSeededPhaseLogLabel(
        buildScreenshotCaptureExecutionPlan(["public-portal-project", "filled-issues-loading"]),
      ),
    ).toBe("\n  📋 Phase 2: Seed data + public pages + filled states");
  });

  it("returns the authenticated bootstrap only for authenticated execution contexts", () => {
    expect(
      getAuthenticatedScreenshotBootstrap(
        {
          authBootstrap: { authStorageState: { cookies: [], origins: [] }, orgSlug: "acme" },
          bootstrapMode: "authenticated",
          seedOrgSlug: "acme",
        },
        "empty-state",
      ),
    ).toEqual({
      authStorageState: { cookies: [], origins: [] },
      orgSlug: "acme",
    });

    expect(() =>
      getAuthenticatedScreenshotBootstrap(
        {
          authBootstrap: null,
          bootstrapMode: "primary-user",
          seedOrgSlug: undefined,
        },
        "filled-state",
      ),
    ).toThrow("Authenticated bootstrap is required for screenshot filled-state capture");
  });

  it("derives the selected screenshot page ids from the current CLI filters", () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["landing", "portal-project", "issues-loading"],
    };

    expect(getSelectedScreenshotPageIds()).toEqual([
      "public-landing",
      "public-portal-project",
      "filled-my-issues-loading",
      "filled-issues-loading",
    ]);
    expect(buildScreenshotCapturePhasePlan()).toEqual({
      emptyCaptureNames: [],
      filledCaptureNames: ["my-issues-loading", "issues-loading"],
      seededPublicCaptureNames: ["portal-project"],
      seedlessPublicCaptureNames: ["landing"],
      selectedPageIds: [
        "public-landing",
        "public-portal-project",
        "filled-my-issues-loading",
        "filled-issues-loading",
      ],
    });
    expect(buildScreenshotCaptureExecutionPlan()).toEqual({
      bootstrapMode: "authenticated",
      phasePlan: {
        emptyCaptureNames: [],
        filledCaptureNames: ["my-issues-loading", "issues-loading"],
        seededPublicCaptureNames: ["portal-project"],
        seedlessPublicCaptureNames: ["landing"],
        selectedPageIds: [
          "public-landing",
          "public-portal-project",
          "filled-my-issues-loading",
          "filled-issues-loading",
        ],
      },
      runEmptyPhase: false,
      runFilledPhase: true,
      runSeededPhase: true,
      runSeededPublicPhase: true,
      runSeedlessPublicPhase: true,
    });
  });

  it("enumerates only targets that match the active filters", () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      configFilters: new Set(["desktop-light"]),
      matchFilters: ["landing"],
    };
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    enumerateDryRunTargets([{ viewport: "desktop", theme: "light" }]);

    const lines = logSpy.mock.calls.map(([line]) => String(line));
    expect(lines.some((line) => line.includes("[public] landing"))).toBe(true);
    expect(lines.some((line) => line.includes("[public] signin"))).toBe(false);
    expect(lines.some((line) => line.includes("Total: 1 screenshots would be captured"))).toBe(
      true,
    );
  });

  it("wraps authenticated screenshot pages and forwards storage state", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    const context = {
      close: vi.fn(async () => {}),
      newPage: vi.fn(async () => page),
    } as BrowserContext;
    const browser = {
      newContext: vi.fn(async () => context),
    } as Browser;
    const callback = vi.fn(async () => {});
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValueOnce(true);

    const authenticated = await withAuthenticatedScreenshotPage(
      browser,
      "desktop",
      "light",
      "acme",
      callback,
      {
        storageState: { cookies: [], origins: [] },
      },
    );

    expect(authenticated).toBe(true);
    expect(callback).toHaveBeenCalledWith(page);
    expect(browser.newContext).toHaveBeenCalledWith({
      colorScheme: "light",
      storageState: { cookies: [], origins: [] },
      timezoneId: E2E_TIMEZONE,
      viewport: { height: 1080, width: 1920 },
    });
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("returns false and skips the callback when screenshot auth fails", async () => {
    const page = {
      goto: vi.fn(async () => {}),
    } as Page;
    const context = {
      close: vi.fn(async () => {}),
      newPage: vi.fn(async () => page),
    } as BrowserContext;
    const browser = {
      newContext: vi.fn(async () => context),
    } as Browser;
    const callback = vi.fn(async () => {});
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValueOnce(false);

    const authenticated = await withAuthenticatedScreenshotPage(
      browser,
      "mobile",
      "light",
      "acme",
      callback,
    );

    expect(authenticated).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("captures bootstrap auth storage state through the shared screenshot target helper", async () => {
    const harness = createBrowserHarness();
    const launchBrowser = vi.fn(async () => harness.browser);
    vi.spyOn(testUserService, "deleteTestUser").mockResolvedValueOnce(true);
    vi.spyOn(testUserService, "createTestUser").mockResolvedValueOnce({ success: true });
    vi.spyOn(testUserService, "resolveScreenshotOrgSlug").mockResolvedValueOnce({
      orgSlug: "acme",
      success: true,
    });
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValueOnce(true);

    const bootstrap = await prepareScreenshotAuthBootstrap(launchBrowser);

    expect(bootstrap).toEqual({
      orgSlug: "acme",
      authStorageState: { cookies: [], origins: [] },
    });
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(harness.browser.newContext).toHaveBeenCalledWith({
      colorScheme: "dark",
      timezoneId: E2E_TIMEZONE,
      viewport: { height: 1080, width: 1920 },
    });
    expect(harness.context.close).toHaveBeenCalledTimes(1);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  it("prepares a no-bootstrap screenshot execution context for seedless public-only runs", async () => {
    const launchBrowser = vi.fn<() => Promise<Browser>>();

    const executionContext = await prepareScreenshotCaptureExecutionContext(
      launchBrowser,
      buildScreenshotCaptureExecutionPlan(["public-landing"]),
    );

    expect(executionContext).toEqual({
      authBootstrap: null,
      bootstrapMode: "none",
      seedOrgSlug: undefined,
    });
    expect(launchBrowser).not.toHaveBeenCalled();
  });

  it("prepares a primary-user execution context for seeded public-only runs", async () => {
    const launchBrowser = vi.fn<() => Promise<Browser>>();
    const deleteSpy = vi.spyOn(testUserService, "deleteTestUser").mockResolvedValue(true);
    const createSpy = vi.spyOn(testUserService, "createTestUser").mockResolvedValue({
      success: true,
    });

    const executionContext = await prepareScreenshotCaptureExecutionContext(
      launchBrowser,
      buildScreenshotCaptureExecutionPlan(["public-portal-project"]),
    );

    expect(executionContext).toEqual({
      authBootstrap: null,
      bootstrapMode: "primary-user",
      seedOrgSlug: undefined,
    });
    expect(deleteSpy).toHaveBeenCalledWith("e2e-teamlead-s0-screenshots@inbox.mailtrap.io");
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(launchBrowser).not.toHaveBeenCalled();
  });

  it("prepares an authenticated execution context for empty and filled runs", async () => {
    const harness = createBrowserHarness();
    const launchBrowser = vi.fn(async () => harness.browser);
    const deleteSpy = vi.spyOn(testUserService, "deleteTestUser").mockResolvedValue(true);
    vi.spyOn(testUserService, "createTestUser").mockResolvedValue({ success: true });
    vi.spyOn(testUserService, "resolveScreenshotOrgSlug").mockResolvedValue({
      orgSlug: "acme",
      success: true,
    });
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValueOnce(true);

    const executionContext = await prepareScreenshotCaptureExecutionContext(
      launchBrowser,
      buildScreenshotCaptureExecutionPlan(["filled-issues-loading"]),
    );

    expect(executionContext).toEqual({
      authBootstrap: {
        authStorageState: { cookies: [], origins: [] },
        orgSlug: "acme",
      },
      bootstrapMode: "authenticated",
      seedOrgSlug: "acme",
    });
    expect(deleteSpy).toHaveBeenNthCalledWith(1, "e2e-member-s0-screenshots@inbox.mailtrap.io");
    expect(deleteSpy).toHaveBeenNthCalledWith(2, "e2e-teamlead-s0-screenshots@inbox.mailtrap.io");
    expect(launchBrowser).toHaveBeenCalledTimes(1);
  });

  it("runs an authenticated screenshot capture behind one shared browser session", async () => {
    const harness = createBrowserHarness();
    const launchBrowser = vi.fn(async () => harness.browser);
    const callback = vi.fn(async () => {});
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValueOnce(true);

    const authenticated = await runAuthenticatedScreenshotCapture(
      launchBrowser,
      "desktop",
      "light",
      "acme",
      callback,
      {
        storageState: { cookies: [], origins: [] },
      },
    );

    expect(authenticated).toBe(true);
    expect(callback).toHaveBeenCalledWith({
      browser: harness.browser,
      page: harness.page,
    });
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  it("retries crash-like authenticated screenshot captures and closes both browsers", async () => {
    const firstAttempt = createBrowserHarness();
    const secondAttempt = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(firstAttempt.browser)
      .mockResolvedValueOnce(secondAttempt.browser);
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    const callback = vi
      .fn<(context: { browser: Browser; page: Page }) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Target page, context or browser has been closed"))
      .mockResolvedValueOnce(undefined);
    const logFailures: string[] = [];

    const authenticated = await runRetriedAuthenticatedScreenshotCapture(
      launchBrowser,
      "desktop",
      "light",
      "acme",
      callback,
      {
        maxAttempts: 2,
        onAttemptFailure: (attempt, message, retrying) => {
          logFailures.push(`${attempt}:${message}:${retrying ? "retry" : "stop"}`);
        },
      },
    );

    expect(authenticated).toBe(true);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(firstAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(secondAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(logFailures).toEqual(["1:Target page, context or browser has been closed:retry"]);
  });

  it("retries filled-state capture once after a crash-like error and closes both browsers", async () => {
    const firstAttempt = createBrowserHarness();
    const secondAttempt = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(firstAttempt.browser)
      .mockResolvedValueOnce(secondAttempt.browser);
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    vi.mocked(screenshotFilledStates)
      .mockRejectedValueOnce(new Error("Target page, context or browser has been closed"))
      .mockResolvedValueOnce(undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await captureFilledStatesForConfig(
      launchBrowser,
      "desktop",
      "light",
      "acme",
      { success: true, orgSlug: "acme" },
      { cookies: [], origins: [] },
      { includeSeededPublicPages: false },
    );

    expect(launchBrowser).toHaveBeenCalledTimes(2);
    expect(publicSpy).not.toHaveBeenCalled();
    expect(screenshotFilledStates).toHaveBeenCalledTimes(2);
    expect(firstAttempt.context.close).toHaveBeenCalledTimes(1);
    expect(firstAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(secondAttempt.context.close).toHaveBeenCalledTimes(1);
    expect(secondAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("failed on attempt 1"))).toBe(
      true,
    );
  });

  it("runs empty captures before seeded filled captures through the shared session flow", async () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["dashboard"],
    };

    const bootstrapHarness = createBrowserHarness();
    const emptyHarness = createBrowserHarness();
    const filledHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(bootstrapHarness.browser)
      .mockResolvedValueOnce(emptyHarness.browser)
      .mockResolvedValueOnce(filledHarness.browser);
    const callOrder: string[] = [];

    vi.spyOn(testUserService, "deleteTestUser").mockImplementation(async (email) => {
      callOrder.push(`delete:${email}`);
      return true;
    });
    vi.spyOn(testUserService, "createTestUser").mockImplementation(async () => {
      callOrder.push("create:primary");
      return { success: true };
    });
    vi.spyOn(testUserService, "resolveScreenshotOrgSlug").mockImplementationOnce(async () => {
      callOrder.push("resolve:bootstrap");
      return { orgSlug: "acme", success: true };
    });
    vi.spyOn(testUserService, "seedScreenshotData").mockImplementationOnce(async () => {
      callOrder.push("seed:filled");
      return { orgSlug: "acme", success: true };
    });
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    vi.mocked(screenshotEmptyStates).mockImplementation(async () => {
      callOrder.push("capture:empty");
    });
    vi.mocked(screenshotPublicPages).mockImplementation(async () => {
      callOrder.push("capture:public");
    });
    vi.mocked(screenshotFilledStates).mockImplementation(async () => {
      callOrder.push("capture:filled");
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const captured = await captureConfiguredScreenshotStates(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(captured).toBe(true);
    expect(callOrder).toEqual([
      "delete:e2e-member-s0-screenshots@inbox.mailtrap.io",
      "delete:e2e-teamlead-s0-screenshots@inbox.mailtrap.io",
      "create:primary",
      "resolve:bootstrap",
      "capture:empty",
      "seed:filled",
      "capture:filled",
    ]);
    expect(launchBrowser).toHaveBeenCalledTimes(3);
    expect(bootstrapHarness.browser.close).toHaveBeenCalledTimes(1);
    expect(emptyHarness.browser.close).toHaveBeenCalledTimes(1);
    expect(filledHarness.browser.close).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("Phase 1: Empty states"))).toBe(
      true,
    );
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 2: Seed data + filled states"),
      ),
    ).toBe(true);
  });

  it("skips the seeded phase entirely when filters only target empty captures", async () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["empty-outreach"],
    };

    const bootstrapHarness = createBrowserHarness();
    const emptyHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(bootstrapHarness.browser)
      .mockResolvedValueOnce(emptyHarness.browser);

    vi.spyOn(testUserService, "deleteTestUser").mockResolvedValue(true);
    vi.spyOn(testUserService, "createTestUser").mockResolvedValue({ success: true });
    vi.spyOn(testUserService, "resolveScreenshotOrgSlug").mockResolvedValue({
      orgSlug: "acme",
      success: true,
    });
    const seedSpy = vi.spyOn(testUserService, "seedScreenshotData");
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    vi.mocked(screenshotEmptyStates).mockResolvedValue(undefined);
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    const filledSpy = vi.mocked(screenshotFilledStates).mockResolvedValue(undefined);
    publicSpy.mockClear();
    filledSpy.mockClear();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const captured = await captureConfiguredScreenshotStates(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(captured).toBe(true);
    expect(launchBrowser).toHaveBeenCalledTimes(2);
    expect(seedSpy).not.toHaveBeenCalled();
    expect(publicSpy).not.toHaveBeenCalled();
    expect(filledSpy).not.toHaveBeenCalled();
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 2: Seed data + public pages + filled states"),
      ),
    ).toBe(false);
  });

  it("captures seedless public filters without auth bootstrap or seeded setup", async () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["landing"],
    };

    const publicHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(publicHarness.browser);

    const deleteSpy = vi.spyOn(testUserService, "deleteTestUser");
    const createSpy = vi.spyOn(testUserService, "createTestUser");
    const resolveSpy = vi.spyOn(testUserService, "resolveScreenshotOrgSlug");
    const seedSpy = vi.spyOn(testUserService, "seedScreenshotData");
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    publicSpy.mockClear();
    vi.mocked(ensureAuthenticatedScreenshotPage).mockClear();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const captured = await captureConfiguredScreenshotStates(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(captured).toBe(true);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(publicSpy).toHaveBeenCalledTimes(1);
    expect(publicSpy).toHaveBeenCalledWith(publicHarness.page, undefined, { group: "seedless" });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
    expect(resolveSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
    expect(ensureAuthenticatedScreenshotPage).not.toHaveBeenCalled();
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 0: Public pages (no seed required)"),
      ),
    ).toBe(true);
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("Phase 1: Empty states"))).toBe(
      false,
    );
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 2: Seed data + token-backed public pages"),
      ),
    ).toBe(false);
  });

  it("captures seeded public filters without auth bootstrap when no authenticated states are selected", async () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["portal-project"],
    };

    const publicHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(publicHarness.browser);

    const deleteSpy = vi.spyOn(testUserService, "deleteTestUser").mockResolvedValue(true);
    const createSpy = vi.spyOn(testUserService, "createTestUser").mockResolvedValue({
      success: true,
    });
    const resolveSpy = vi.spyOn(testUserService, "resolveScreenshotOrgSlug");
    const seedSpy = vi.spyOn(testUserService, "seedScreenshotData").mockResolvedValue({
      portalProjectId: "project-1",
      portalToken: "portal-token",
      success: true,
    });
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    publicSpy.mockClear();
    vi.mocked(ensureAuthenticatedScreenshotPage).mockClear();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const captured = await captureConfiguredScreenshotStates(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(captured).toBe(true);
    expect(launchBrowser).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith("e2e-teamlead-s0-screenshots@inbox.mailtrap.io");
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(resolveSpy).not.toHaveBeenCalled();
    expect(seedSpy).toHaveBeenCalledWith("e2e-teamlead-s0-screenshots@inbox.mailtrap.io", {
      orgSlug: undefined,
    });
    expect(publicSpy).toHaveBeenCalledTimes(1);
    expect(publicSpy).toHaveBeenCalledWith(
      publicHarness.page,
      expect.objectContaining({
        portalProjectId: "project-1",
        portalToken: "portal-token",
        success: true,
      }),
      { group: "seeded" },
    );
    expect(ensureAuthenticatedScreenshotPage).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("Phase 1: Empty states"))).toBe(
      false,
    );
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 2: Seed data + token-backed public pages"),
      ),
    ).toBe(true);
  });

  it("skips the empty phase entirely when filters only target seeded captures", async () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      matchFilters: ["issues-loading"],
    };

    const bootstrapHarness = createBrowserHarness();
    const filledHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(bootstrapHarness.browser)
      .mockResolvedValueOnce(filledHarness.browser);

    vi.spyOn(testUserService, "deleteTestUser").mockResolvedValue(true);
    vi.spyOn(testUserService, "createTestUser").mockResolvedValue({ success: true });
    vi.spyOn(testUserService, "resolveScreenshotOrgSlug").mockResolvedValue({
      orgSlug: "acme",
      success: true,
    });
    vi.spyOn(testUserService, "seedScreenshotData").mockResolvedValue({
      orgSlug: "acme",
      success: true,
    });
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    const emptySpy = vi.mocked(screenshotEmptyStates).mockResolvedValue(undefined);
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    const filledSpy = vi.mocked(screenshotFilledStates).mockResolvedValue(undefined);
    emptySpy.mockClear();
    publicSpy.mockClear();
    filledSpy.mockClear();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const captured = await captureConfiguredScreenshotStates(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(captured).toBe(true);
    expect(launchBrowser).toHaveBeenCalledTimes(2);
    expect(emptySpy).not.toHaveBeenCalled();
    expect(publicSpy).not.toHaveBeenCalled();
    expect(filledSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("Phase 1: Empty states"))).toBe(
      false,
    );
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 2: Seed data + filled states"),
      ),
    ).toBe(true);
  });

  it("runs the staged screenshot lifecycle behind the shared session helper", async () => {
    const stagingBaseDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "cascade-screenshot-session-success-"),
    );
    const outputSummary = new Map([["e2e/screenshots", 2]]);
    vi.spyOn(captureModule, "getStagedOutputSummary").mockReturnValue(outputSummary);
    const promoteSpy = vi
      .spyOn(captureModule, "promoteStagedScreenshots")
      .mockImplementation(() => {});

    captureState.captureFailures = 9;
    captureState.captureSkips = 4;
    captureState.currentConfigPrefix = "desktop-dark";
    captureState.totalScreenshots = 8;

    const result = await runConfiguredScreenshotCaptureSession(
      async () => createBrowserHarness().browser,
      [{ viewport: "desktop", theme: "light" }],
      {
        runConfiguredStates: async () => {
          expect(captureState.captureFailures).toBe(0);
          expect(captureState.captureSkips).toBe(0);
          expect(captureState.currentConfigPrefix).toBe("");
          expect(captureState.totalScreenshots).toBe(0);
          expect(fs.existsSync(captureState.stagingRootDir)).toBe(true);

          captureState.captureSkips = 1;
          captureState.totalScreenshots = 2;
          return true;
        },
        stagingBaseDir,
      },
    );

    expect(result).toEqual({
      captureSkips: 1,
      outputSummary,
      totalScreenshots: 2,
    });
    expect(promoteSpy).toHaveBeenCalledTimes(1);
    expect(captureState.stagingRootDir).toBe("");
    expect(fs.readdirSync(stagingBaseDir)).toHaveLength(0);
    fs.rmSync(stagingBaseDir, { recursive: true, force: true });
  });

  it("cleans up staged output without promotion when the run aborts early", async () => {
    const stagingBaseDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "cascade-screenshot-session-null-"),
    );
    const promoteSpy = vi
      .spyOn(captureModule, "promoteStagedScreenshots")
      .mockImplementation(() => {});
    const summarySpy = vi.spyOn(captureModule, "getStagedOutputSummary");

    const result = await runConfiguredScreenshotCaptureSession(
      async () => createBrowserHarness().browser,
      [{ viewport: "desktop", theme: "light" }],
      {
        runConfiguredStates: async () => false,
        stagingBaseDir,
      },
    );

    expect(result).toBeNull();
    expect(promoteSpy).not.toHaveBeenCalled();
    expect(summarySpy).not.toHaveBeenCalled();
    expect(captureState.stagingRootDir).toBe("");
    expect(fs.readdirSync(stagingBaseDir)).toHaveLength(0);
    fs.rmSync(stagingBaseDir, { recursive: true, force: true });
  });

  it("cleans up staged output and fails when a run captures nothing", async () => {
    const stagingBaseDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "cascade-screenshot-session-zero-"),
    );
    const promoteSpy = vi
      .spyOn(captureModule, "promoteStagedScreenshots")
      .mockImplementation(() => {});

    await expect(
      runConfiguredScreenshotCaptureSession(
        async () => createBrowserHarness().browser,
        [{ viewport: "desktop", theme: "light" }],
        {
          runConfiguredStates: async () => true,
          stagingBaseDir,
        },
      ),
    ).rejects.toThrow("No screenshots matched the provided filters");

    expect(promoteSpy).not.toHaveBeenCalled();
    expect(captureState.stagingRootDir).toBe("");
    expect(fs.readdirSync(stagingBaseDir)).toHaveLength(0);
    fs.rmSync(stagingBaseDir, { recursive: true, force: true });
  });

  it("runs the seedless public phase through the shared phase helper", async () => {
    const publicHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(publicHarness.browser);
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    publicSpy.mockClear();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runSeedlessPublicScreenshotPhase(launchBrowser, [
      { viewport: "desktop", theme: "light" },
    ]);

    expect(publicSpy).toHaveBeenCalledWith(publicHarness.page, undefined, { group: "seedless" });
    expect(
      logSpy.mock.calls.some(([line]) =>
        String(line).includes("Phase 0: Public pages (no seed required)"),
      ),
    ).toBe(true);
  });

  it("runs the empty phase through the shared phase helper", async () => {
    const emptyHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(emptyHarness.browser);
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    const emptySpy = vi.mocked(screenshotEmptyStates).mockResolvedValue(undefined);
    emptySpy.mockClear();

    await runEmptyScreenshotPhase(launchBrowser, [{ viewport: "desktop", theme: "light" }], {
      authBootstrap: { authStorageState: { cookies: [], origins: [] }, orgSlug: "acme" },
      bootstrapMode: "authenticated",
      seedOrgSlug: "acme",
    });

    expect(emptySpy).toHaveBeenCalledWith(emptyHarness.page, "acme");
  });

  it("runs the seeded phase as filled-only when the execution plan excludes seeded public pages", async () => {
    const filledHarness = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(filledHarness.browser);
    vi.spyOn(testUserService, "seedScreenshotData").mockResolvedValue({
      orgSlug: "acme",
      success: true,
    });
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    const publicSpy = vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
    const filledSpy = vi.mocked(screenshotFilledStates).mockResolvedValue(undefined);
    publicSpy.mockClear();
    filledSpy.mockClear();

    await runSeededScreenshotPhase(
      launchBrowser,
      [{ viewport: "desktop", theme: "light" }],
      buildScreenshotCaptureExecutionPlan(["filled-issues-loading"]),
      {
        authBootstrap: { authStorageState: { cookies: [], origins: [] }, orgSlug: "acme" },
        bootstrapMode: "authenticated",
        seedOrgSlug: "acme",
      },
    );

    expect(publicSpy).not.toHaveBeenCalled();
    expect(filledSpy).toHaveBeenCalledTimes(1);
  });
});
