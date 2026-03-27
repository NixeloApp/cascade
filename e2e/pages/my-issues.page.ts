import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  getMyIssuesDueDateFilterOptionTestId,
  getMyIssuesPriorityFilterOptionTestId,
  TEST_IDS,
} from "../../src/lib/test-ids";
import { E2E_TIMEZONE } from "../constants";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { createIsolatedPageTarget } from "../utils/page-targets";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";
import { SettingsPage } from "./settings.page";

/**
 * My Issues Page Object
 * Handles the personal issue board route and its filter states.
 */
export class MyIssuesPage extends BasePage {
  static async withLoadingPage<T>(
    sourcePage: Page,
    orgSlug: string,
    colorScheme: "light" | "dark",
    run: (myIssuesPage: MyIssuesPage) => Promise<T>,
  ): Promise<T> {
    const loadingTarget = await createIsolatedPageTarget(sourcePage, {
      colorScheme,
      timezoneId: E2E_TIMEZONE,
    });

    try {
      const settingsPage = new SettingsPage(loadingTarget.page, orgSlug);
      await settingsPage.goto();
      await settingsPage.waitForCaptureReady("profile");
      await loadingTarget.context.setOffline(true);
      await settingsPage.openMyIssuesWithoutWaiting();
      return await run(new MyIssuesPage(loadingTarget.page, orgSlug));
    } finally {
      await loadingTarget.context.setOffline(false);
      await loadingTarget.close();
    }
  }

  readonly content: Locator;
  readonly columns: Locator;
  readonly dueDateFilter: Locator;
  readonly loadingState: Locator;
  readonly pageEmptyState: Locator;
  readonly filterSummary: Locator;
  readonly priorityFilter: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.MY_ISSUES.CONTENT);
    this.columns = page.getByTestId(TEST_IDS.MY_ISSUES.COLUMN);
    this.dueDateFilter = page.getByTestId(TEST_IDS.MY_ISSUES.DUE_DATE_FILTER);
    this.loadingState = page.getByTestId(TEST_IDS.PAGE.LOADING_STATE);
    this.pageEmptyState = page.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
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

          return (await isLocatorVisible(this.pageEmptyState)) ? "ready" : "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async expectFilterSummaryVisible(): Promise<void> {
    await expect(this.filterSummary).toBeVisible();
    await expect(this.filterSummary).toContainText(/loaded issues/i);
  }

  async selectPriorityFilter(label: string): Promise<void> {
    const optionValue = label.toLowerCase();
    await expect(this.priorityFilter).toBeVisible();
    await this.priorityFilter.click();
    const option = this.page.getByTestId(getMyIssuesPriorityFilterOptionTestId(optionValue));
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.priorityFilter).toContainText(new RegExp(label, "i"));
  }

  async selectDueDateFilter(label: string): Promise<void> {
    const normalizedLabel = label.trim().toLowerCase();
    const optionValue =
      normalizedLabel === "no due date"
        ? "no-date"
        : normalizedLabel === "all due dates"
          ? "all"
          : normalizedLabel;
    await expect(this.dueDateFilter).toBeVisible();
    await this.dueDateFilter.click();
    const option = this.page.getByTestId(getMyIssuesDueDateFilterOptionTestId(optionValue));
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.dueDateFilter).toContainText(new RegExp(label, "i"));
  }

  async expectLoadingStateVisible(): Promise<void> {
    await expect(this.loadingState).toBeVisible();
    await expect(this.page.getByTestId(TEST_IDS.LOADING.SPINNER)).toBeVisible();
  }

  async expectFilteredEmptyState(): Promise<void> {
    await expect(this.pageEmptyState).toBeVisible();
    await expect(this.pageEmptyState).toContainText("No issues match these filters");
  }
}
