import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ROUTES } from "../utils/routes";
import { waitForDashboardReady } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/** Meetings workspace page object for seeded and empty-state E2E coverage. */
export class MeetingsPage extends BasePage {
  readonly pageHeading: Locator;
  readonly meetingMemoryHeading: Locator;
  readonly recentMeetingsHeading: Locator;
  readonly meetingDetailHeading: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly meetingsSearchInput: Locator;
  readonly transcriptSearchInput: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    this.pageHeading = page.getByRole("heading", { name: /^meetings$/i }).first();
    this.meetingMemoryHeading = page.getByRole("heading", { name: /^meeting memory$/i }).first();
    this.recentMeetingsHeading = page.getByRole("heading", { name: /^recent meetings$/i }).first();
    this.meetingDetailHeading = page.getByRole("heading", { name: /^meeting detail$/i }).first();
    this.emptyStateTitle = page.getByText(/no meeting recordings yet/i);
    this.emptyStateDescription = page.getByText(
      /schedule from calendar or add a direct meeting url to start capturing transcripts, summaries, and follow-up work\./i,
    );
    this.meetingsSearchInput = page.getByRole("searchbox", { name: "Search meetings" });
    this.transcriptSearchInput = page.getByRole("searchbox", { name: "Search transcript" });
  }

  async goto() {
    await this.gotoPath(ROUTES.meetings.build(this.orgSlug));
    await this.expectLoaded();
  }

  async expectLoaded() {
    await waitForDashboardReady(this.page);
    await expect(this.pageHeading).toBeVisible();

    await expect
      .poll(
        async () => {
          if (await this.emptyStateTitle.isVisible().catch(() => false)) {
            return "empty";
          }

          if (await this.meetingsSearchInput.isVisible().catch(() => false)) {
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
    await expect(
      this.page.getByRole("button", { name: new RegExp(title, "i") }).first(),
    ).toBeVisible();
  }

  async openRecording(title: string) {
    await this.page
      .getByRole("button", { name: new RegExp(title, "i") })
      .first()
      .click();
  }

  async expectRecordingDetail(title: string) {
    await expect(this.page.getByRole("heading", { name: title }).first()).toBeVisible();
  }

  async filterTranscript(query: string) {
    await this.transcriptSearchInput.fill(query);
  }

  async expectTranscriptMatch(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async filterMemoryByProject(projectKey: string) {
    await this.page.getByRole("button").filter({ hasText: projectKey }).first().click();
  }

  async expectMemoryDescription(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectMemoryItemVisible(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
