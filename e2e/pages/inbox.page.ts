import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

export class InboxPage extends BasePage {
  readonly bulkActions: Locator;
  readonly closedTab: Locator;
  readonly closedEmptyState: Locator;
  readonly customSnoozeDialog: Locator;
  readonly declineDialog: Locator;
  readonly duplicateDialog: Locator;
  readonly inboxRows: Locator;
  readonly openEmptyState: Locator;
  readonly searchInput: Locator;
  readonly snoozeMenu: Locator;

  constructor(
    page: Page,
    orgSlug: string,
    private readonly projectKey: string,
  ) {
    super(page, orgSlug);
    this.bulkActions = page.getByTestId(TEST_IDS.PROJECT_INBOX.BULK_ACTIONS);
    this.closedTab = page.getByTestId(TEST_IDS.PROJECT_INBOX.CLOSED_TAB);
    this.closedEmptyState = page.getByTestId(TEST_IDS.PROJECT_INBOX.CLOSED_EMPTY_STATE);
    this.customSnoozeDialog = page.getByTestId(TEST_IDS.PROJECT_INBOX.CUSTOM_SNOOZE_DIALOG);
    this.declineDialog = page.getByTestId(TEST_IDS.PROJECT_INBOX.DECLINE_DIALOG);
    this.duplicateDialog = page.getByTestId(TEST_IDS.PROJECT_INBOX.DUPLICATE_DIALOG);
    this.inboxRows = page.getByTestId(TEST_IDS.PROJECT_INBOX.ROW);
    this.openEmptyState = page.getByTestId(TEST_IDS.PROJECT_INBOX.OPEN_EMPTY_STATE);
    this.searchInput = page.getByTestId(TEST_IDS.PROJECT_INBOX.SEARCH_INPUT);
    this.snoozeMenu = page.getByTestId(TEST_IDS.PROJECT_INBOX.SNOOZE_MENU);
  }

  async goto() {
    await this.gotoPath(ROUTES.projects.inbox.build(this.orgSlug, this.projectKey));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await expect(this.searchInput).toBeVisible({ timeout: 12000 });
        await expect
          .poll(
            async () => {
              const rowCount = await getLocatorCount(this.inboxRows);
              if (rowCount > 0) {
                return "rows";
              }

              if (
                (await isLocatorVisible(
                  this.page.getByTestId(TEST_IDS.PROJECT_INBOX.OPEN_EMPTY_STATE),
                )) ||
                (await isLocatorVisible(
                  this.page.getByTestId(TEST_IDS.PROJECT_INBOX.CLOSED_EMPTY_STATE),
                ))
              ) {
                return "empty";
              }

              return "pending";
            },
            { timeout: 12000 },
          )
          .not.toBe("pending");
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }

        await this.page.reload({ waitUntil: "domcontentloaded" });
      }
    }
  }

  async selectFirstOpenIssue(): Promise<void> {
    const rowCheckbox = this.page.getByRole("checkbox").nth(1);
    await expect(rowCheckbox).toBeVisible();
    await rowCheckbox.click();
  }

  async openFirstIssueSnoozeMenu(): Promise<void> {
    const snoozeButton = this.page.getByRole("button", { name: /^snooze$/i }).first();
    await expect(snoozeButton).toBeVisible();
    await snoozeButton.click();
    await expect(this.snoozeMenu).toBeVisible();
  }

  async openFirstIssueDeclineDialog(): Promise<void> {
    const declineButton = this.page.getByRole("button", { name: /^decline$/i }).first();
    await expect(declineButton).toBeVisible();
    await declineButton.click();
    await expect(this.declineDialog).toBeVisible();
  }

  async openFirstIssueDuplicateDialog(): Promise<void> {
    const actionsButton = this.page.getByRole("button", { name: /more actions for/i }).first();
    await expect(actionsButton).toBeVisible();
    await actionsButton.click();
    await this.page.getByRole("menuitem", { name: /mark duplicate/i }).click();
    await expect(this.duplicateDialog).toBeVisible();
  }

  async openClosedTab(): Promise<void> {
    await expect(this.closedTab).toBeVisible();
    await this.closedTab.click();
  }

  async expectOpenEmptyState(): Promise<void> {
    await expect
      .poll(async () => await isLocatorVisible(this.openEmptyState), { timeout: 12000 })
      .toBe(true);
    await expect(this.openEmptyState).toContainText(/no pending items/i);
  }

  async expectClosedEmptyState(): Promise<void> {
    await expect
      .poll(async () => await isLocatorVisible(this.closedEmptyState), { timeout: 12000 })
      .toBe(true);
    await expect(this.closedEmptyState).toContainText(/no closed items/i);
  }
}
