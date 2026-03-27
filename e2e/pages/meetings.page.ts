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
  readonly pageEmptyState: Locator;
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
    this.pageEmptyState = page.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
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

  async waitForCaptureReady(): Promise<void> {
    await this.expectLoaded();

    if (await isLocatorVisible(this.pageEmptyState)) {
      return;
    }

    await expect
      .poll(
        async () =>
          (await isLocatorVisible(this.memorySection)) ||
          (await isLocatorVisible(this.meetingsSearchInput)),
        {
          message: "Expected meetings workspace content to render for reviewed capture",
          timeout: 12000,
        },
      )
      .toBe(true);
  }

  async expectLoaded() {
    await waitForDashboardReady(this.page);
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });

    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.pageEmptyState)) {
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
    await expect(this.pageEmptyState).toBeVisible();
  }

  async expectRecordingVisible(title: string) {
    await expect(this.getRecordingCard(title)).toBeVisible();
  }

  async openRecording(title: string) {
    const card = this.getRecordingCard(title);
    await card.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
  }

  async expectRecordingDetail(title: string) {
    await expect(this.detailSection.getByTestId(TEST_IDS.MEETINGS.DETAIL_TITLE)).toHaveTextContent(
      title,
    );
  }

  async expectRecordingSummary(text: string) {
    await expect(
      this.detailSection.getByTestId(TEST_IDS.MEETINGS.DETAIL_SUMMARY),
    ).toHaveTextContent(text);
  }

  private detailTab(label: string) {
    return this.detailSection.getByRole("tab", { name: new RegExp(`^${label}$`, "i") }).first();
  }

  async openDetailTabIfPresent(label: string) {
    const tab = this.detailTab(label);
    if (!(await isLocatorVisible(tab))) {
      return;
    }

    await tab.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
    await expect(tab).toHaveAttribute("data-state", "active");
  }

  async filterTranscript(query: string) {
    await this.openDetailTabIfPresent("Transcript");
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
    await this.statusFilter.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${statusLabel}$`, "i"),
    });
    await expect(option).toBeVisible();
    await option.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
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
    const lensButton = this.memorySection.getByTestId(
      TEST_IDS.MEETINGS.MEMORY_FILTER_BUTTON(projectKey),
    );
    await lensButton.waitFor({ state: "visible", timeout: 10000 });
    await lensButton.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
  }

  async expectMemoryDescription(text: string) {
    await expect(
      this.memorySection.getByTestId(TEST_IDS.MEETINGS.MEMORY_DESCRIPTION),
    ).toHaveTextContent(text);
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
    await this.openDetailTabIfPresent("Actions");
    await expect(
      this.getActionItem(description).getByRole("button", { name: /^create issue$/i }),
    ).toBeEnabled();
  }

  async createIssueFromActionItem(description: string) {
    await this.openDetailTabIfPresent("Actions");
    await this.getActionItem(description)
      .getByRole("button", { name: /^create issue$/i })
      .click();
    await this.expectToast("Issue created from action item");
  }

  async expectLinkedIssue(description: string, issueKey: string, issueTitle: string) {
    await this.openDetailTabIfPresent("Actions");
    const actionItem = this.getActionItem(description);
    await expect(actionItem.getByText("Issue linked")).toBeVisible();
    await expect(actionItem.getByText(issueKey, { exact: false })).toBeVisible();
    await expect(actionItem.getByText(issueTitle, { exact: true })).toBeVisible();
    await expect(actionItem.getByRole("link", { name: /open issue/i })).toBeVisible();
  }

  async openLinkedIssue(description: string) {
    await this.openDetailTabIfPresent("Actions");
    await this.getActionItem(description)
      .getByRole("link", { name: /open issue/i })
      .click();
  }

  private getRecordingCard(title: string): Locator {
    return this.recentSection.locator(
      `[data-slot="${TEST_IDS.MEETINGS.RECORDING_CARD_ITEM(title)}"]`,
    );
  }
}
