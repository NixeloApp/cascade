import type { Locator, Page } from "@playwright/test";
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
 * Wait until the SW has cached the current page URL.
 * Uses cache.match() with the full URL (including query params)
 * so the probe matches exactly what the SW will serve offline.
 */
async function waitForCurrentPageCached(page: Page, timeout = 30000) {
  await page.waitForFunction(
    async (url) => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        if (await cache.match(url)) {
          return true;
        }
      }
      return false;
    },
    page.url(),
    { timeout },
  );
}

/**
 * Ensure the SW is controlling and has cached the target route.
 * Visits the page, waits for a readyLocator to confirm content has
 * rendered, then reloads so the SW caches the full response.
 */
async function ensureRouteCached(page: Page, url: string, readyLocator: Locator) {
  await page.goto(url, { waitUntil: "load" });
  await waitForControllingWorker(page);
  await expect(readyLocator).toBeVisible({ timeout: 15000 });
  // Reload so the SW fetch handler intercepts and caches the rendered response
  await page.reload({ waitUntil: "load" });
  await waitForControllingWorker(page);
  await expect(readyLocator).toBeVisible({ timeout: 15000 });
  await waitForCurrentPageCached(page);
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
    await expect(settingsPage.pageHeaderTitle).toBeVisible({ timeout: 15000 });
    // Reload so the SW intercepts and caches the fully-rendered response
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await expect(settingsPage.pageHeaderTitle).toBeVisible({ timeout: 15000 });
    await waitForCurrentPageCached(page);
    await settingsPage.switchToTab("preferences");

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");
      await page.reload({ waitUntil: "load" });
      await dispatchConnectivityEvent(page, "offline");

      // Verify the SW served the cached page shell (not the offline fallback).
      // We cannot assert React-rendered elements here because Convex queries
      // cannot resolve offline, so the React app stays in a loading state.
      // The URL and absence of the fallback page prove the cache works.
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(settingsUrl)}(?:\\?.*)?$`));
      await expect(settingsPage.offlineFallbackHeading).toHaveCount(0);
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
    await ensureRouteCached(page, dashboardUrl, dashboardPage.pageHeaderTitle);
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
    await expect(settingsPage.pageHeaderTitle).toBeVisible({ timeout: 15000 });
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await expect(settingsPage.pageHeaderTitle).toBeVisible({ timeout: 15000 });
    await waitForCurrentPageCached(page);

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
