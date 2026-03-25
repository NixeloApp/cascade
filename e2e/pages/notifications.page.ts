import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
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
  readonly markAllReadButton: Locator;
  readonly mentionsFilter: Locator;
  readonly unreadBadge: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.archiveAllButton = page.getByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVE_ALL_BUTTON);
    this.archivedEmptyState = page.getByTestId(TEST_IDS.NOTIFICATIONS.ARCHIVED_EMPTY_STATE);
    this.archivedTab = page.getByRole("tab", { name: /archived/i });
    this.content = page.getByTestId(TEST_IDS.NOTIFICATIONS.CONTENT);
    this.inboxEmptyState = page.getByTestId(TEST_IDS.NOTIFICATIONS.INBOX_EMPTY_STATE);
    this.markAllReadButton = page.getByTestId(TEST_IDS.NOTIFICATIONS.MARK_ALL_READ_BUTTON);
    this.mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
    this.unreadBadge = page.getByTestId(TEST_IDS.NOTIFICATIONS.UNREAD_BADGE);
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

  async openArchivedTab(): Promise<void> {
    await expect(this.archivedTab).toBeVisible();
    await this.archivedTab.click();
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
}
