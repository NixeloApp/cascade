import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { withQueryBlockedPage } from "../utils/convex-loading";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import {
  dismissAllDialogs,
  dismissIfOpen,
  waitForAnimation,
  waitForScreenshotReady,
} from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Issues List Page Object
 * Handles the global issues view with filtering and issue cards.
 */
export class IssuesPage extends BasePage {
  static async withLoadingPage<T>(
    sourcePage: Page,
    orgSlug: string,
    run: (issuesPage: IssuesPage) => Promise<T>,
  ): Promise<T> {
    return withQueryBlockedPage(
      sourcePage,
      ["issues/queries:listOrganizationIssues"],
      async (loadingPage) => run(new IssuesPage(loadingPage, orgSlug)),
    );
  }

  readonly createIssueButton: Locator;
  readonly detailModal: Locator;
  readonly detailModalIssueKey: Locator;
  readonly detailModalTitle: Locator;
  readonly issueCards: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly typeFilter: Locator;
  readonly filterSummary: Locator;
  readonly pageEmptyState: Locator;
  readonly createIssueModal: Locator;
  readonly issueTitleInput: Locator;
  readonly loadingSpinner: Locator;
  readonly sidePanelToggle: Locator;
  readonly modalToggle: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.createIssueButton = page.getByRole("button", { name: /create issue/i });
    this.detailModal = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    this.detailModalIssueKey = this.detailModal.getByTestId(TEST_IDS.ISSUE.DETAIL_KEY);
    this.detailModalTitle = this.detailModal.getByTestId(TEST_IDS.ISSUE.DETAIL_TITLE);
    this.issueCards = page.getByTestId(TEST_IDS.ISSUE.CARD);
    this.searchInput = page.getByTestId(TEST_IDS.ISSUE.SEARCH_INPUT);
    this.statusFilter = page.getByTestId(TEST_IDS.ISSUE.STATUS_FILTER);
    this.priorityFilter = page.getByTestId(TEST_IDS.ISSUE.PRIORITY_FILTER);
    this.typeFilter = page.getByTestId(TEST_IDS.ISSUE.TYPE_FILTER);
    this.filterSummary = page.getByTestId(TEST_IDS.ISSUE.FILTER_SUMMARY);
    this.pageEmptyState = page.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
    this.createIssueModal = page.getByTestId(TEST_IDS.ISSUE.CREATE_MODAL);
    this.issueTitleInput = page.getByTestId(TEST_IDS.ISSUE.CREATE_TITLE_INPUT);
    this.loadingSpinner = page.getByTestId(TEST_IDS.LOADING.SPINNER);
    this.sidePanelToggle = page.getByRole("button", { name: /switch to side panel view/i }).first();
    this.modalToggle = page.getByRole("button", { name: /switch to modal view/i }).first();
  }

  async goto() {
    await this.gotoPath(ROUTES.issues.list.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.createIssueButton.waitFor({ state: "visible", timeout: 12000 });
    await this.searchInput.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          const cardCount = await getLocatorCount(this.issueCards);
          if (cardCount > 0) return "ready";
          return (await isLocatorVisible(this.pageEmptyState)) ? "empty" : "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }

  async gotoAndExpectLoadingState(timeout = 12000): Promise<void> {
    await this.goto();
    await this.expectLoadingStateVisible(timeout);
  }

  async searchIssues(query: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(query);
  }

  async filterByStatus(statusLabel: string): Promise<void> {
    await expect(this.statusFilter).toBeVisible();
    await this.statusFilter.click();
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${statusLabel}$`, "i"),
    });
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.statusFilter).toContainText(new RegExp(statusLabel, "i"));
  }

  async openCreateIssueModal(): Promise<void> {
    await dismissAllDialogs(this.page);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(this.createIssueButton).toBeVisible();
      await this.createIssueButton.click();
      if (await this.waitForCreateIssueModalReady(3000)) {
        return;
      }
      await dismissIfOpen(this.page, this.createIssueModal);
    }

    await this.expectCreateIssueModalReady();
  }

  async expectCreateIssueModalCaptureReady(timeout = 5000): Promise<void> {
    await this.expectCreateIssueModalReady(timeout);
    await expect(this.page.getByLabel(/create another/i)).toBeVisible({ timeout });
    await waitForAnimation(this.page);
    await waitForScreenshotReady(this.page);
  }

  async expectSearchResultVisible(text: string): Promise<void> {
    await expect(
      this.issueCards
        .filter({ hasText: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })
        .first(),
    ).toBeVisible();
  }

  async expectSearchEmptyState(): Promise<void> {
    await expect(this.pageEmptyState).toBeVisible();
    await expect(this.pageEmptyState).toContainText("No issues found");
  }

  async expectFilterSummaryVisible(): Promise<void> {
    await expect(this.filterSummary).toBeVisible();
    await expect(this.filterSummary).toContainText(/issues? matching filters/i);
  }

  async switchToSidePanelMode(): Promise<void> {
    await expect(this.sidePanelToggle).toBeVisible();
    await this.sidePanelToggle.click();
  }

  async switchToModalModeIfVisible(): Promise<void> {
    if (await isLocatorVisible(this.modalToggle)) {
      await this.modalToggle.click();
    }
  }

  async waitForDetailPanel(expectedIssueKey?: string): Promise<void> {
    await expect(this.detailModal).toBeVisible({ timeout: 5000 });
    if (expectedIssueKey) {
      await expect(this.detailModalIssueKey).toHaveText(expectedIssueKey, { timeout: 5000 });
      return;
    }
    await this.detailModalIssueKey.waitFor({ timeout: 5000 });
    await this.detailModalTitle.waitFor({ timeout: 5000 });
  }

  async expectLoadingStateVisible(timeout = 12000): Promise<void> {
    await this.searchInput.waitFor({ state: "visible", timeout });
    await this.createIssueButton.waitFor({ state: "visible", timeout });
    await expect
      .poll(() => this.loadingSpinner.count(), {
        timeout,
      })
      .toBeGreaterThanOrEqual(1);
  }

  private async waitForCreateIssueModalReady(timeout = 12000): Promise<boolean> {
    try {
      await this.expectCreateIssueModalReady(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectCreateIssueModalReady(timeout = 12000): Promise<void> {
    await expect(this.createIssueModal).toBeVisible({ timeout });
    await expect(
      this.issueTitleInput.or(
        this.createIssueModal.getByRole("button", { name: /get ai suggestions/i }),
      ),
    ).toBeVisible({ timeout });
  }
}
