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
  const controlTimeoutMs = 5000;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), {
        timeout: controlTimeoutMs,
      });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      await waitForRegisteredWorker(page);
      await page.reload({ waitUntil: "load" });
    }
  }
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

async function getPreviewRuntimeState(page: Page) {
  return page.evaluate(async () => {
    const manifestHref =
      document.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null;
    const cacheNames = await caches.keys();
    const cacheEntries = await Promise.all(
      cacheNames.map(async (cacheName) => {
        const requests = await (await caches.open(cacheName)).keys();
        return requests.map((request) => new URL(request.url).pathname);
      }),
    );

    return {
      cacheEntries: cacheEntries.flat(),
      cacheNames,
      manifestHref,
    };
  });
}

async function getInstallabilityState(page: Page) {
  const client = await page.context().newCDPSession(page);
  const installability = (await client.send("Page.getInstallabilityErrors")) as {
    installabilityErrors: Array<{
      errorId: string;
      errorArguments?: Array<{ name: string; value: string }>;
    }>;
  };
  const manifest = (await client.send("Page.getAppManifest")) as {
    url: string;
    errors: Array<{ message: string }>;
  };

  return {
    installabilityErrors: installability.installabilityErrors,
    manifestErrors: manifest.errors,
    manifestUrl: manifest.url,
  };
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

  test("links the production manifest and caches core shell assets", async ({ page, baseURL }) => {
    await page.goto(baseURL ?? "/");
    await waitForRegisteredWorker(page);

    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);

    await page.waitForFunction(async () => {
      const cacheNames = await caches.keys();
      const cacheEntries = await Promise.all(
        cacheNames.map(async (cacheName) => {
          const requests = await (await caches.open(cacheName)).keys();
          return requests.map((request) => new URL(request.url).pathname);
        }),
      );
      const paths = cacheEntries.flat();

      return (
        paths.includes("/") &&
        paths.includes("/offline.html") &&
        paths.includes("/manifest.webmanifest") &&
        paths.includes("/icon-192.png") &&
        paths.includes("/icon-512.png") &&
        paths.includes("/apple-touch-icon.png") &&
        paths.includes("/badge-72.png")
      );
    });

    const runtimeState = await getPreviewRuntimeState(page);

    expect(runtimeState.manifestHref).toBe("/manifest.webmanifest");
    expect(runtimeState.cacheEntries).toContain("/");
    expect(runtimeState.cacheEntries).toContain("/offline.html");
    expect(runtimeState.cacheEntries).toContain("/manifest.webmanifest");
    expect(runtimeState.cacheEntries).toContain("/icon-192.png");
    expect(runtimeState.cacheEntries).toContain("/icon-512.png");
    expect(runtimeState.cacheEntries).toContain("/apple-touch-icon.png");
    expect(runtimeState.cacheEntries).toContain("/badge-72.png");
  });

  test("meets Chromium installability checks in preview", async ({ page, baseURL }) => {
    await page.goto(baseURL ?? "/");
    await waitForRegisteredWorker(page);

    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);

    const installabilityState = await getInstallabilityState(page);

    expect(installabilityState.manifestUrl.endsWith("/manifest.webmanifest")).toBe(true);
    expect(installabilityState.manifestErrors).toEqual([]);
    expect(installabilityState.installabilityErrors).toEqual([]);
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
