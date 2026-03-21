import { expect, type Page, test } from "@playwright/test";

async function waitForRegisteredWorker(page: Page) {
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active);
  });
}

async function waitForControllingWorker(page: Page) {
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
}

async function getServiceWorkerState(page: Page) {
  return page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      return {
        controllerScriptUrl: null,
        registrations: [] as Array<{ scope: string; scriptUrl: string | null }>,
        supported: false,
      };
    }

    const registrations = await navigator.serviceWorker.getRegistrations();

    return {
      controllerScriptUrl: navigator.serviceWorker.controller?.scriptURL ?? null,
      registrations: registrations.map((registration) => ({
        scope: registration.scope,
        scriptUrl:
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          null,
      })),
      supported: true,
    };
  });
}

test.describe("PWA Preview Runtime", () => {
  test("registers the app-owned service worker in preview", async ({ page, baseURL }) => {
    await page.goto(baseURL ?? "/");
    await waitForRegisteredWorker(page);

    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);

    const state = await getServiceWorkerState(page);

    expect(state.supported).toBe(true);
    expect(state.controllerScriptUrl?.endsWith("/service-worker.js")).toBe(true);
    expect(
      state.registrations.some((registration) =>
        registration.scriptUrl?.endsWith("/service-worker.js"),
      ),
    ).toBe(true);
    expect(
      state.registrations.some((registration) => registration.scriptUrl?.endsWith("/sw.js")),
    ).toBe(false);
  });

  test("serves the offline fallback page for an uncached navigation while offline", async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL ?? "/");
    await waitForRegisteredWorker(page);

    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);

    await page.context().setOffline(true);

    try {
      await page.goto(`${baseURL}/preview-offline-probe-${Date.now()}`, {
        waitUntil: "load",
      });

      await expect(page.getByRole("heading", { name: /you're offline/i })).toBeVisible();
      await expect(page.getByText(/lost your internet connection/i)).toBeVisible();
      await expect(page.locator("#status-text")).toHaveText(/no internet connection/i);
    } finally {
      await page.context().setOffline(false);
    }
  });
});
