import type { Page } from "@playwright/test";
import { expect, authenticatedTest as test } from "../fixtures";
import { escapeRegExp, ROUTES } from "../utils/routes";

const OFFLINE_TIMEZONE_CHOICES = ["America/Chicago", "America/Denver"] as const;
const OFFLINE_USER_SETTINGS_MUTATION_TYPE = "userSettings.update";

function pickDifferentTimezone(currentTimezone: string): string {
  return currentTimezone === OFFLINE_TIMEZONE_CHOICES[0]
    ? OFFLINE_TIMEZONE_CHOICES[1]
    : OFFLINE_TIMEZONE_CHOICES[0];
}

async function dispatchConnectivityEvent(page: Page, type: "online" | "offline") {
  await page.evaluate((eventType) => {
    window.dispatchEvent(new Event(eventType));
  }, type);
}

async function waitForControllingWorker(page: Page) {
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
}

/**
 * Wait until the SW has cached a specific URL path.
 * Polls the Cache API until the path appears in any cache.
 * This replaces the fragile "reload and hope" approach — we only
 * go offline after the cache is provably populated.
 */
async function waitForCachedRoute(page: Page, urlPath: string, timeout = 30000) {
  await page.waitForFunction(
    async (path) => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        if (keys.some((req) => new URL(req.url).pathname === path)) {
          return true;
        }
      }
      return false;
    },
    urlPath,
    { timeout },
  );
}

/**
 * Ensure the SW is controlling and has cached the target route.
 * Visits the page, waits for content to render and the SW to cache
 * the response before returning. The page must fully render while
 * online so the SW caches a complete response, not a loading shell.
 */
async function ensureRouteCached(page: Page, url: string, urlPath: string) {
  await page.goto(url, { waitUntil: "load" });
  await waitForControllingWorker(page);
  // Wait for content to render while online
  await page.waitForLoadState("domcontentloaded");
  // Reload so the SW fetch handler intercepts and caches the response
  await page.reload({ waitUntil: "load" });
  await waitForControllingWorker(page);
  await page.waitForLoadState("domcontentloaded");
  await waitForCachedRoute(page, urlPath);
}

test.describe("Offline Replay Preview", () => {
  test.describe.configure({ mode: "serial" });

  test("reloads a visited authenticated settings route while offline in preview", async ({
    page,
    orgSlug,
    settingsPage,
  }) => {
    test.slow();
    const settingsUrl = ROUTES.settings.profile.build(orgSlug);

    // Visit settings, wait for full render, then confirm SW has cached the route.
    // The order matters: the page must fully render (so the SW fetch handler
    // caches the complete response), and we must verify the heading is visible
    // while still online before going offline.
    await settingsPage.goto();
    await waitForControllingWorker(page);
    await expect(settingsPage.pageHeaderTitle).toBeVisible({
      timeout: 15000,
    });
    // Reload so the SW intercepts and caches the fully-rendered response
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await expect(settingsPage.pageHeaderTitle).toBeVisible({
      timeout: 15000,
    });
    await waitForCachedRoute(page, settingsUrl);
    await settingsPage.switchToTab("preferences");

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");
      await page.reload({ waitUntil: "load" });
      await dispatchConnectivityEvent(page, "offline");

      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(settingsUrl)}(?:\\?.*)?$`));
      // The SW served the cached page, not the offline fallback
      await expect(settingsPage.offlineFallbackHeading).toHaveCount(0);
      await settingsPage.offlineTab.click();
      await expect(settingsPage.offlineTab).toHaveAttribute("aria-selected", "true");
      await expect(settingsPage.syncStatusIndicator).toContainText("Offline");
    } finally {
      await page.context().setOffline(false);
      await dispatchConnectivityEvent(page, "online");
    }
  });

  test("navigates back to a previously visited authenticated dashboard route while offline in preview", async ({
    page,
    dashboardPage,
    settingsPage,
    orgSlug,
  }) => {
    test.slow();

    const dashboardUrl = ROUTES.dashboard.build(orgSlug);

    // Ensure both routes are cached before going offline
    await ensureRouteCached(page, dashboardUrl, dashboardUrl);
    await settingsPage.goto();
    await settingsPage.switchToTab("preferences");

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");
      await page.goto(dashboardUrl, { waitUntil: "load" });

      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(dashboardUrl)}$`));
      // The SW served the cached page, not the offline fallback
      await expect(dashboardPage.offlineFallbackHeading).toHaveCount(0);
    } finally {
      await page.context().setOffline(false);
      await dispatchConnectivityEvent(page, "online");
    }
  });

  test("queues a timezone update offline and replays it after reconnect in preview", async ({
    page,
    settingsPage,
  }) => {
    test.slow();
    let originalTimezone = "UTC";
    let queuedTimezone = "America/Chicago";

    await settingsPage.goto();
    await waitForControllingWorker(page);
    // Wait for settings to fully render while online
    await expect(settingsPage.pageHeaderTitle).toBeVisible({
      timeout: 15000,
    });
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await expect(settingsPage.pageHeaderTitle).toBeVisible({
      timeout: 15000,
    });
    // Wait for the settings route to be cached
    await page.waitForFunction(
      async () => {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          if (keys.some((req) => new URL(req.url).pathname.includes("/settings"))) {
            return true;
          }
        }
        return false;
      },
      { timeout: 30000 },
    );

    await settingsPage.switchToTab("preferences");
    originalTimezone = await settingsPage.getCurrentTimezoneLabel();
    queuedTimezone = pickDifferentTimezone(originalTimezone);

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");

      await settingsPage.selectTimezone(queuedTimezone);
      await settingsPage.expectToast("Timezone change queued for sync when you are back online");

      await settingsPage.offlineTab.click();
      await expect(settingsPage.offlineTab).toHaveAttribute("aria-selected", "true");
      await expect(settingsPage.syncStatusIndicator).toContainText("Offline");
      await settingsPage.expectOfflineQueueItemVisible(OFFLINE_USER_SETTINGS_MUTATION_TYPE);
      await expect(settingsPage.page.getByText(/^Never$/)).toBeVisible();

      // Process Queue is hidden while offline — restore network first
      await page.context().setOffline(false);
      await dispatchConnectivityEvent(page, "online");
      await expect(settingsPage.processQueueButton).toBeVisible();

      await settingsPage.processOfflineQueue();
      await settingsPage.expectToast("Queued items processed");
      await settingsPage.expectOfflineQueueHidden();
      await expect(settingsPage.lastSuccessfulReplayLabel).toBeVisible();
      await expect(settingsPage.page.getByText(/^Never$/)).toHaveCount(0);

      await settingsPage.switchToTab("preferences");
      await settingsPage.page.reload({ waitUntil: "load" });
      await waitForControllingWorker(page);
      await settingsPage.waitForLoad();
      await settingsPage.switchToTab("preferences");
      await settingsPage.expectTimezoneSelected(queuedTimezone);
    } finally {
      await page.context().setOffline(false);
      await dispatchConnectivityEvent(page, "online");

      await settingsPage.goto();
      await settingsPage.switchToTab("preferences");
      const currentTimezone = await settingsPage.getCurrentTimezoneLabel();

      if (currentTimezone !== originalTimezone) {
        await settingsPage.selectTimezone(originalTimezone);
        await settingsPage.expectTimezoneSelected(originalTimezone);
      }
    }
  });
});
