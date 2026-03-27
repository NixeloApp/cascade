import type { Browser, BrowserContext, Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";
import { createIsolatedPageTarget, createSiblingPageTarget } from "./page-targets";

function createPageTargetHarness() {
  const siblingPage = {
    close: vi.fn(async () => {}),
    isClosed: vi.fn(() => false),
  } satisfies Partial<Page>;
  const isolatedPage = {
    close: vi.fn(async () => {}),
    isClosed: vi.fn(() => false),
  } satisfies Partial<Page>;
  const isolatedContext = {
    close: vi.fn(async () => {}),
    newPage: vi.fn(async () => isolatedPage as Page),
  } satisfies Partial<BrowserContext>;
  const browser = {
    newContext: vi.fn(async () => isolatedContext as BrowserContext),
  } satisfies Partial<Browser>;
  const sourceContext = {
    browser: vi.fn(() => browser as Browser),
    newPage: vi.fn(async () => siblingPage as Page),
    storageState: vi.fn(async () => ({ cookies: [], origins: [] })),
  } satisfies Partial<BrowserContext>;
  const sourcePage = {
    context: vi.fn(() => sourceContext as BrowserContext),
    viewportSize: vi.fn(() => ({ height: 900, width: 1440 })),
  } satisfies Partial<Page>;

  return {
    browser,
    isolatedContext,
    isolatedPage,
    siblingPage,
    sourceContext,
    sourcePage: sourcePage as Page,
  };
}

describe("page target helpers", () => {
  it("creates and closes sibling pages in the source context", async () => {
    const harness = createPageTargetHarness();

    const target = await createSiblingPageTarget(harness.sourcePage);

    expect(target.page).toBe(harness.siblingPage);
    expect(harness.sourceContext.newPage).toHaveBeenCalledTimes(1);

    await target.close();

    expect(harness.siblingPage.close).toHaveBeenCalledTimes(1);
  });

  it("creates isolated pages with inherited auth and explicit overrides", async () => {
    const harness = createPageTargetHarness();

    const target = await createIsolatedPageTarget(harness.sourcePage, {
      colorScheme: "dark",
      timezoneId: "America/Chicago",
    });

    expect(target.page).toBe(harness.isolatedPage);
    expect(harness.browser.newContext).toHaveBeenCalledWith({
      colorScheme: "dark",
      storageState: { cookies: [], origins: [] },
      timezoneId: "America/Chicago",
      viewport: { height: 900, width: 1440 },
    });

    await target.close();

    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });

  it("closes the isolated context when page creation fails", async () => {
    const harness = createPageTargetHarness();
    harness.isolatedContext.newPage.mockRejectedValueOnce(new Error("boom"));

    await expect(createIsolatedPageTarget(harness.sourcePage)).rejects.toThrow("boom");
    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });
});
