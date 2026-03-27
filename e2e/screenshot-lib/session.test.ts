import type { Browser, BrowserContext, Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { E2E_TIMEZONE } from "../constants";
import { ensureAuthenticatedScreenshotPage } from "./auth";
import { captureState } from "./capture";
import {
  enumerateDryRunTargets,
  formatConfigLabel,
  withAuthenticatedScreenshotPage,
} from "./session";

vi.mock("./auth", () => ({
  ensureAuthenticatedScreenshotPage: vi.fn(),
}));

describe("screenshot session helpers", () => {
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
});
