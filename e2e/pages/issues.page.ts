import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * Issues List Page Object
 * Handles the global issues view with filtering and issue cards.
 */
export class IssuesPage extends BasePage {
  readonly createIssueButton: Locator;
  readonly detailModal: Locator;
  readonly detailModalIssueKey: Locator;
  readonly issueCards: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly typeFilter: Locator;
  readonly filterSummary: Locator;
  readonly pageEmptyState: Locator;
  readonly createIssueModal: Locator;
  readonly issueTitleInput: Locator;
  readonly sidePanelToggle: Locator;
  readonly modalToggle: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.createIssueButton = page.getByRole("button", { name: /create issue/i });
    this.detailModal = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    this.detailModalIssueKey = this.detailModal.getByText(/[A-Z][A-Z0-9]+-\d+/).first();
    this.issueCards = page.getByTestId(TEST_IDS.ISSUE.CARD);
    this.searchInput = page.getByTestId(TEST_IDS.ISSUE.SEARCH_INPUT);
    this.statusFilter = page.getByTestId(TEST_IDS.ISSUE.STATUS_FILTER);
    this.priorityFilter = page.getByTestId(TEST_IDS.ISSUE.PRIORITY_FILTER);
    this.typeFilter = page.getByTestId(TEST_IDS.ISSUE.TYPE_FILTER);
    this.filterSummary = page.getByTestId(TEST_IDS.ISSUE.FILTER_SUMMARY);
    this.pageEmptyState = page.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
    this.createIssueModal = page.getByTestId(TEST_IDS.ISSUE.CREATE_MODAL);
    this.issueTitleInput = page.getByTestId(TEST_IDS.ISSUE.CREATE_TITLE_INPUT);
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
    await expect(this.createIssueButton).toBeVisible();
    await this.createIssueButton.click();
    await expect(this.createIssueModal).toBeVisible();
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

  async waitForDetailPanel(): Promise<void> {
    await expect(this.detailModal).toBeVisible({ timeout: 5000 });
    await this.detailModalIssueKey.waitFor({ timeout: 5000 });
  }
}
