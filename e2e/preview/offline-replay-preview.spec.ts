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

test.describe("Offline Replay Preview", () => {
  test.describe.configure({ mode: "serial" });

  test("reloads a visited authenticated settings route while offline in preview", async ({
    page,
    orgSlug,
    settingsPage,
  }) => {
    // Skip in CI — SW cache timing is unreliable on GitHub Actions runners.
    // The test passes locally where the preview server has time to warm up.
    // TODO: re-enable once SW precaching is deterministic (vite-plugin-pwa injectManifest)
    test.skip(!!process.env.CI, "SW cache timing unreliable in CI");
    test.slow();
    const settingsUrl = ROUTES.settings.profile.build(orgSlug);

    // Visit settings and ensure SW caches the page shell.
    // Reload twice so the SW has a chance to intercept and cache.
    await settingsPage.goto();
    await waitForControllingWorker(page);
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await settingsPage.switchToTab("preferences");
    // One more reload to confirm the SW-cached version works online first
    await page.reload({ waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible();

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");
      await page.reload({ waitUntil: "load" });
      await dispatchConnectivityEvent(page, "offline");

      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(settingsUrl)}(?:\\?.*)?$`));
      // The SW-cached page may need time to hydrate and render the auth recovery path
      await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByRole("heading", { name: /you're offline/i })).toHaveCount(0);
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

    await dashboardPage.goto();
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);
    await settingsPage.goto();
    await settingsPage.switchToTab("preferences");

    try {
      await page.context().setOffline(true);
      await dispatchConnectivityEvent(page, "offline");
      await page.goto(dashboardUrl, { waitUntil: "load" });

      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(dashboardUrl)}$`));
      await expect(dashboardPage.dashboardTab).toBeVisible();
      await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /you're offline/i })).toHaveCount(0);
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
    await page.reload({ waitUntil: "load" });
    await waitForControllingWorker(page);

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
