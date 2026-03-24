import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { BasePage } from "./base.page";

/**
 * Roadmap Page Object
 * Handles the Gantt-style roadmap timeline view.
 */
export class RoadmapPage extends BasePage {
  readonly timelineCanvas: Locator;
  readonly issueHeader: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.timelineCanvas = page.getByTestId(TEST_IDS.ROADMAP.TIMELINE_CANVAS);
    this.issueHeader = page.getByTestId(TEST_IDS.ROADMAP.ISSUE_HEADER);
  }

  async goto() {
    // Roadmap is per-project; caller should navigate via project route.
    throw new Error("RoadmapPage.goto() requires a project key — use gotoProject() instead");
  }

  async gotoProject(projectKey: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(ROUTES.projects.roadmap.build(this.orgSlug, projectKey));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.timelineCanvas)) return "ready";
          if (await isLocatorVisible(this.page.getByText(/no issues with target dates/i)))
            return "empty";
          return "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }
}
