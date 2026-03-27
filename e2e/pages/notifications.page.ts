import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { blockConvexMutation } from "../utils/convex-loading";
import { getLocatorCount, getOptionalLocatorText, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import {
  waitForAnimation,
  waitForDashboardReady,
  waitForScreenshotReady,
} from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Notifications Page Object
 * Handles the full-page notification center with filtering and pagination.
 */
export class NotificationsPage extends BasePage {
  readonly archiveAllButton: Locator;
  readonly archivedEmptyState: Locator;
  readonly archivedTab: Locator;
  readonly content: Locator;
  readonly inboxEmptyState: Locator;
  readonly inboxTab: Locator;
  readonly markAllReadButton: Locator;
  readonly mentionsFilter: Locator;
  readonly notificationItems: Locator;
  readonly unreadBadge: Locator;
  readonly mentionNotificationText: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.archiveAllButton = page.getByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVE_ALL_BUTTON);
    this.archivedEmptyState = page.getByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVED_EMPTY_STATE);
    this.archivedTab = page.getByRole("tab", { name: /archived/i });
    this.content = page.getByTestId(TEST_IDS.NOTIFICATIONS.CONTENT);
    this.inboxEmptyState = page.getByTestId(TEST_IDS.NOTIFICATIONS.INBOX_EMPTY_STATE);
    this.inboxTab = page.getByRole("tab", { name: /inbox/i });
    this.markAllReadButton = this.content.getByTestId(TEST_IDS.NOTIFICATIONS.MARK_ALL_READ_BUTTON);
    this.mentionsFilter = this.content.getByRole("button", { name: /^mentions$/i });
    this.notificationItems = this.content.getByTestId(TEST_IDS.NOTIFICATION.ITEM);
    this.unreadBadge = this.content.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE);
    this.mentionNotificationText = this.content.getByText(/you were mentioned/i);
  }

  async goto() {
    await this.gotoPath(ROUTES.notifications.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.content)) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async waitForCaptureReady(): Promise<void> {
    await waitForDashboardReady(this.page);
    await waitForScreenshotReady(this.page);
    await expect
      .poll(
        async () =>
          (await isLocatorVisible(this.pageHeaderTitle)) || (await isLocatorVisible(this.inboxTab)),
        { timeout: 12000 },
      )
      .toBe(true);

    await expect
      .poll(
        async () => {
          const unreadBadgeVisible = await isLocatorVisible(this.unreadBadge);
          const markAllReadVisible = await isLocatorVisible(this.markAllReadButton);
          const archiveAllVisible = await isLocatorVisible(this.archiveAllButton);
          const archivedSelected =
            (await this.archivedTab.getAttribute("aria-selected")) === "true";
          const itemCount = await getLocatorCount(this.notificationItems);
          const inboxEmptyVisible = await isLocatorVisible(this.inboxEmptyState);
          const archivedEmptyVisible = await isLocatorVisible(this.archivedEmptyState);

          if (archivedSelected && (itemCount > 0 || archivedEmptyVisible)) {
            return "ready";
          }

          if (
            itemCount > 0 ||
            inboxEmptyVisible ||
            unreadBadgeVisible ||
            markAllReadVisible ||
            archiveAllVisible
          ) {
            return "ready";
          }

          return "pending";
        },
        { timeout: 10000 },
      )
      .toBe("ready");
  }

  async waitForUnreadOverflowReady(): Promise<void> {
    await waitForDashboardReady(this.page);
    await waitForScreenshotReady(this.page);
    await expect
      .poll(
        async () => {
          const unreadBadgeText = await getOptionalLocatorText(this.unreadBadge);
          const markAllReadVisible = await isLocatorVisible(this.markAllReadButton);
          const itemCount = await getLocatorCount(this.notificationItems);

          return unreadBadgeText === "99+" && markAllReadVisible && itemCount > 0
            ? "ready"
            : "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async waitForArchivedTabReady(): Promise<void> {
    await expect(this.archivedTab).toHaveAttribute("aria-selected", "true");
    await expect
      .poll(
        async () => {
          const itemCount = await getLocatorCount(this.notificationItems);
          const emptyVisible = await isLocatorVisible(this.archivedEmptyState);
          return itemCount > 0 || emptyVisible ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected archived notifications content or empty state to render",
        },
      )
      .toBe("ready");
  }

  async openArchivedTab(): Promise<void> {
    await expect(this.archivedTab).toBeVisible();
    await this.archivedTab.click();
  }

  async openArchivedTabAndWait(): Promise<void> {
    await this.openArchivedTab();
    await this.waitForArchivedTabReady();
  }

  async expectInboxEmptyState(): Promise<void> {
    await expect(this.inboxEmptyState).toBeVisible();
  }

  async expectArchivedEmptyState(): Promise<void> {
    await expect(this.archivedEmptyState).toBeVisible();
  }

  async expectUnreadOverflowBadge(): Promise<void> {
    await expect(this.unreadBadge).toHaveText("99+");
  }

  async activateMentionsFilter(): Promise<void> {
    await expect(this.mentionsFilter).toBeVisible();
    await this.mentionsFilter.click();
  }

  async waitForMentionsFilterResults(): Promise<void> {
    await expect
      .poll(
        async () => {
          const mentionVisible = await isLocatorVisible(this.mentionNotificationText);
          const emptyVisible = await isLocatorVisible(this.inboxEmptyState);
          return mentionVisible || emptyVisible ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected Mentions filter results to finish rendering",
        },
      )
      .toBe("ready");

    await waitForAnimation(this.page);
  }

  async openMarkAllReadLoadingState(): Promise<() => Promise<void>> {
    const releaseMutationBlock = await blockConvexMutation(
      this.page,
      "notifications:markAllAsRead",
    );

    try {
      await expect(this.markAllReadButton).toBeVisible();
      await this.markAllReadButton.click();
      await expect(this.markAllReadButton).toHaveAttribute("aria-busy", "true");
      await expect(this.markAllReadButton).toBeDisabled();
      return releaseMutationBlock;
    } catch (error) {
      await releaseMutationBlock();
      throw error;
    }
  }
}
