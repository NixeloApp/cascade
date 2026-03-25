import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { waitForDashboardReady } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/** Meetings workspace page object for seeded and empty-state E2E coverage. */
export class MeetingsPage extends BasePage {
  readonly recentSection: Locator;
  readonly detailSection: Locator;
  readonly memorySection: Locator;
  readonly actionItemsSection: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly meetingsSearchInput: Locator;
  readonly transcriptSearchInput: Locator;
  readonly scheduleButton: Locator;
  readonly scheduleDialog: Locator;
  readonly filterEmptyState: Locator;
  readonly detailEmptyState: Locator;
  readonly summaryProcessingState: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    this.recentSection = page.getByTestId(TEST_IDS.MEETINGS.RECENT_SECTION);
    this.detailSection = page.getByTestId(TEST_IDS.MEETINGS.DETAIL_SECTION);
    this.memorySection = page.getByTestId(TEST_IDS.MEETINGS.MEMORY_SECTION);
    this.actionItemsSection = page.getByTestId(TEST_IDS.MEETINGS.ACTION_ITEMS_SECTION);
    this.emptyStateTitle = page.getByTestId(TEST_IDS.MEETINGS.EMPTY_STATE);
    this.emptyStateDescription = this.emptyStateTitle;
    this.meetingsSearchInput = page.getByTestId(TEST_IDS.MEETINGS.SEARCH_INPUT);
    this.transcriptSearchInput = page.getByTestId(TEST_IDS.MEETINGS.TRANSCRIPT_SEARCH);
    this.scheduleButton = page.getByTestId(TEST_IDS.MEETINGS.SCHEDULE_BUTTON);
    this.scheduleDialog = page.getByTestId(TEST_IDS.MEETINGS.SCHEDULE_DIALOG);
    this.filterEmptyState = page.getByTestId(TEST_IDS.MEETINGS.FILTER_EMPTY_STATE);
    this.detailEmptyState = page.getByTestId(TEST_IDS.MEETINGS.DETAIL_EMPTY_STATE);
    this.summaryProcessingState = page.getByTestId(TEST_IDS.MEETINGS.SUMMARY_PROCESSING_STATE);
    this.statusFilter = page.getByRole("combobox", { name: "Filter by status" });
  }

  async goto() {
    await this.gotoPath(ROUTES.meetings.build(this.orgSlug));
    await this.expectLoaded();
  }

  async waitUntilReady(): Promise<void> {
    await this.expectLoaded();
  }

  async expectLoaded() {
    await waitForDashboardReady(this.page);
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });

    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.emptyStateTitle)) {
            return "empty";
          }

          if (await isLocatorVisible(this.meetingsSearchInput)) {
            return "workspace";
          }

          return null;
        },
        {
          message: "Expected meetings page to render either the empty state or workspace controls",
        },
      )
      .not.toBeNull();
  }

  async expectEmptyState() {
    await expect(this.emptyStateTitle).toBeVisible();
    await expect(this.emptyStateDescription).toBeVisible();
  }

  async expectRecordingVisible(title: string) {
    const card = this.recentSection.getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD);
    await expect(card.filter({ hasText: new RegExp(title, "i") }).first()).toBeVisible();
  }

  async openRecording(title: string) {
    const card = this.recentSection
      .getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD)
      .filter({ hasText: new RegExp(title, "i") })
      .first();
    await card.click();
  }

  async expectRecordingDetail(title: string) {
    await expect(this.detailSection.getByText(title, { exact: true })).toBeVisible();
  }

  async filterTranscript(query: string) {
    await this.transcriptSearchInput.fill(query);
  }

  async searchMeetings(query: string) {
    await this.meetingsSearchInput.fill(query);
  }

  async openScheduleDialog() {
    await expect(this.scheduleButton).toBeVisible();
    await this.scheduleButton.click();
    await expect(this.scheduleDialog).toBeVisible();
  }

  async filterByStatus(statusLabel: string) {
    await expect(this.statusFilter).toBeVisible();
    await this.statusFilter.click();
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${statusLabel}$`, "i"),
    });
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.statusFilter).toContainText(new RegExp(statusLabel, "i"));
  }

  async expectFilteredEmptyState() {
    await expect(this.filterEmptyState).toBeVisible();
    await expect(this.detailEmptyState).toBeVisible();
  }

  async expectSummaryProcessingState() {
    await expect(this.summaryProcessingState).toBeVisible();
  }

  async expectTranscriptMatch(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async filterMemoryByProject(projectKey: string) {
    await this.memorySection.getByRole("button").filter({ hasText: projectKey }).first().click();
  }

  async expectMemoryDescription(text: string) {
    await expect(this.memorySection.getByText(text)).toBeVisible();
  }

  async expectMemoryItemVisible(text: string) {
    await expect(this.memorySection.getByText(text).first()).toBeVisible();
  }

  private getActionItem(description: string) {
    return this.actionItemsSection
      .getByText(description, { exact: true })
      .locator("xpath=ancestor::li[1]")
      .first();
  }

  async expectActionItemCreateIssueEnabled(description: string) {
    await expect(
      this.getActionItem(description).getByRole("button", { name: /^create issue$/i }),
    ).toBeEnabled();
  }

  async createIssueFromActionItem(description: string) {
    await this.getActionItem(description)
      .getByRole("button", { name: /^create issue$/i })
      .click();
    await this.expectToast("Issue created from action item");
  }

  async expectLinkedIssue(description: string, issueKey: string, issueTitle: string) {
    const actionItem = this.getActionItem(description);
    await expect(actionItem.getByText("Issue linked")).toBeVisible();
    await expect(actionItem.getByText(issueKey, { exact: false })).toBeVisible();
    await expect(actionItem.getByText(issueTitle, { exact: true })).toBeVisible();
    await expect(actionItem.getByRole("link", { name: /open issue/i })).toBeVisible();
  }

  async openLinkedIssue(description: string) {
    await this.getActionItem(description)
      .getByRole("link", { name: /open issue/i })
      .click();
  }
}
