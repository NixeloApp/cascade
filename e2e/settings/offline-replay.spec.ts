import type { Page } from "@playwright/test";
import { expect, authenticatedTest as test } from "../fixtures";

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

test.describe("Offline Replay", () => {
  test.describe.configure({ mode: "serial" });

  test("queues a timezone update offline and replays it after reconnect", async ({
    page,
    settingsPage,
  }) => {
    test.slow();
    let originalTimezone = "UTC";
    let queuedTimezone = "America/Chicago";

    await settingsPage.goto();
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
      await expect(settingsPage.syncStatusIndicator).toContainText("You are offline");
      await settingsPage.expectOfflineQueueItemVisible(OFFLINE_USER_SETTINGS_MUTATION_TYPE);

      // Process Queue is hidden while offline — restore network first
      await page.context().setOffline(false);
      await dispatchConnectivityEvent(page, "online");
      await expect(settingsPage.processQueueButton).toBeVisible();

      await settingsPage.processOfflineQueue();
      await settingsPage.expectToast("Queued items processed");
      await expect(settingsPage.localOfflineQueueHeading).toHaveCount(0);
      await expect(settingsPage.page.getByText(/^Never$/)).toHaveCount(0);

      await settingsPage.switchToTab("preferences");
      await settingsPage.page.reload({ waitUntil: "load" });
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
