import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * My Issues Page Object
 * Handles the personal issue board route and its filter states.
 */
export class MyIssuesPage extends BasePage {
  readonly content: Locator;
  readonly columns: Locator;
  readonly dueDateFilter: Locator;
  readonly emptyState: Locator;
  readonly filterEmptyState: Locator;
  readonly filterSummary: Locator;
  readonly priorityFilter: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.MY_ISSUES.CONTENT);
    this.columns = page.getByTestId(TEST_IDS.MY_ISSUES.COLUMN);
    this.dueDateFilter = page.getByTestId(TEST_IDS.MY_ISSUES.DUE_DATE_FILTER);
    this.emptyState = page.getByTestId(TEST_IDS.MY_ISSUES.EMPTY_STATE);
    this.filterEmptyState = page.getByTestId(TEST_IDS.MY_ISSUES.FILTER_EMPTY_STATE);
    this.filterSummary = page.getByTestId(TEST_IDS.MY_ISSUES.FILTER_SUMMARY);
    this.priorityFilter = page.getByTestId(TEST_IDS.MY_ISSUES.PRIORITY_FILTER);
  }

  async goto() {
    await this.gotoPath(ROUTES.myIssues.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.priorityFilter.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          const columnCount = await getLocatorCount(this.columns);
          if (columnCount > 0) {
            return "ready";
          }

          return (await isLocatorVisible(this.emptyState.or(this.filterEmptyState)))
            ? "ready"
            : "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async filterByPriority(priorityLabel: string): Promise<void> {
    await expect(this.priorityFilter).toBeVisible();
    await this.priorityFilter.click();
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${priorityLabel}$`, "i"),
    });
    await expect(option).toBeVisible();
    await option.click();
  }

  async expectFilterSummaryVisible(): Promise<void> {
    await expect(this.filterSummary).toBeVisible();
    await expect(this.filterSummary).toContainText(/loaded issues/i);
  }

  async expectFilteredEmptyState(): Promise<void> {
    await expect(this.filterEmptyState).toBeVisible();
  }
}
