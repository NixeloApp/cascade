import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { BasePage } from "./base.page";

/**
 * Roadmap Page Object
 * Handles the Gantt-style roadmap timeline view and reviewed screenshot states.
 */
export class RoadmapPage extends BasePage {
  readonly content: Locator;
  readonly dependencyLines: Locator;
  readonly emptyState: Locator;
  readonly groupBySelect: Locator;
  readonly issueDetailModal: Locator;
  readonly issueHeader: Locator;
  readonly milestone: Locator;
  readonly statusGroups: Locator;
  readonly timelineCanvas: Locator;
  readonly timelineSpanSelect: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.ROADMAP.CONTENT);
    this.timelineCanvas = page.getByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS);
    this.issueHeader = page.getByTestId(TEST_IDS.ROADMAP.ISSUE_HEADER);
    this.emptyState = page.getByTestId(TEST_IDS.ROADMAP.EMPTY_STATE);
    this.dependencyLines = page.getByTestId(TEST_IDS.ROADMAP.DEPENDENCY_LINES);
    this.groupBySelect = page.getByTestId(TEST_IDS.ROADMAP.GROUP_BY_SELECT);
    this.timelineSpanSelect = page.getByTestId(TEST_IDS.ROADMAP.TIMELINE_SPAN_SELECT);
    this.issueDetailModal = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    this.milestone = page.locator('[data-testid^="roadmap-milestone-"]').first();
    this.statusGroups = page.locator('[data-testid^="roadmap-group-status:"]');
  }

  async goto() {
    throw new Error("RoadmapPage.goto() requires a project key — use gotoProject() instead");
  }

  async gotoProject(projectKey: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(ROUTES.projects.roadmap.build(this.orgSlug, projectKey));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.content.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.timelineCanvas)) return "timeline";
          if (await isLocatorVisible(this.emptyState)) return "empty";
          return "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }

  async expectTimelineState(): Promise<void> {
    await this.timelineCanvas.waitFor({ state: "visible", timeout: 12000 });
    await this.issueHeader.waitFor({ state: "visible", timeout: 5000 });
    await expect(this.emptyState).toHaveCount(0);
  }

  async expectEmptyState(): Promise<void> {
    await this.emptyState.waitFor({ state: "visible", timeout: 12000 });
    await expect(this.timelineCanvas).toHaveCount(0);
  }

  async expectDependencyLinesVisible(): Promise<void> {
    await this.dependencyLines.waitFor({ state: "visible", timeout: 12000 });
    await expect(this.dependencyLines.locator("path")).toHaveCount(2);
  }

  async expectGroupedState(): Promise<void> {
    await this.expectTimelineState();
    await expect(this.statusGroups).toHaveCount(4);
  }

  async expectDetailState(): Promise<void> {
    await this.expectTimelineState();
    await this.issueDetailModal.waitFor({ state: "visible", timeout: 12000 });
  }

  async expectMilestoneState(): Promise<void> {
    await this.expectTimelineState();
    await this.milestone.waitFor({ state: "visible", timeout: 12000 });
  }

  async openTimelineSpanSelector(): Promise<void> {
    await this.timelineSpanSelect.waitFor({ state: "visible", timeout: 5000 });
    await this.timelineSpanSelect.click();
    await this.page.getByRole("option", { name: /1 month/i }).waitFor({
      state: "visible",
      timeout: 5000,
    });
  }

  async groupByStatus(): Promise<void> {
    await this.groupBySelect.waitFor({ state: "visible", timeout: 5000 });
    await this.groupBySelect.click();
    await this.page.getByRole("option", { name: /^status$/i }).click();
  }

  async openIssueDetail(issueKey: string): Promise<void> {
    const issueButton = this.page.getByRole("button", {
      name: new RegExp(`view issue ${issueKey}`, "i"),
    });
    await issueButton.waitFor({ state: "visible", timeout: 5000 });
    await issueButton.click();
  }
}
