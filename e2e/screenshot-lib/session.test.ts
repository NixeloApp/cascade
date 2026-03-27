import type { Browser, BrowserContext, Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { E2E_TIMEZONE } from "../constants";
import { testUserService } from "../utils/test-user-service";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import { captureState } from "./capture";
import { screenshotFilledStates } from "./filled-states";
import { screenshotPublicPages } from "./public-pages";
import {
  captureFilledStatesForConfig,
  enumerateDryRunTargets,
  formatConfigLabel,
  prepareScreenshotAuthBootstrap,
  withAuthenticatedScreenshotPage,
} from "./session";

vi.mock("./auth", () => ({
  ensureAuthenticatedScreenshotPage: vi.fn(),
}));

vi.mock("./filled-states", () => ({
  screenshotFilledStates: vi.fn(),
}));

vi.mock("./public-pages", () => ({
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
    captureState.currentConfigPrefix = "";
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
    vi.spyOn(testUserService, "seedScreenshotData").mockResolvedValueOnce({
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

  it("retries filled-state capture once after a crash-like error and closes both browsers", async () => {
    const firstAttempt = createBrowserHarness();
    const secondAttempt = createBrowserHarness();
    const launchBrowser = vi
      .fn<() => Promise<Browser>>()
      .mockResolvedValueOnce(firstAttempt.browser)
      .mockResolvedValueOnce(secondAttempt.browser);
    vi.mocked(ensureAuthenticatedScreenshotPage).mockResolvedValue(true);
    vi.mocked(screenshotPublicPages).mockResolvedValue(undefined);
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
    );

    expect(launchBrowser).toHaveBeenCalledTimes(2);
    expect(screenshotFilledStates).toHaveBeenCalledTimes(2);
    expect(firstAttempt.context.close).toHaveBeenCalledTimes(1);
    expect(firstAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(secondAttempt.context.close).toHaveBeenCalledTimes(1);
    expect(secondAttempt.browser.close).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.some(([line]) => String(line).includes("failed on attempt 1"))).toBe(
      true,
    );
  });
});
