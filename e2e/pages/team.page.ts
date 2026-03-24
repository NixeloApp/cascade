import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { BasePage } from "./base.page";

/**
 * Team Detail Page Object
 * Handles the team board view (default view when navigating to a team).
 */
export class TeamPage extends BasePage {
  readonly boardColumns: Locator;
  readonly issueCards: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.boardColumns = page.getByTestId(TEST_IDS.BOARD.COLUMN);
    this.issueCards = page.getByTestId(TEST_IDS.ISSUE.CARD);
  }

  async goto() {
    throw new Error("TeamPage.goto() requires workspace and team slugs — use gotoTeam() instead");
  }

  async gotoTeam(workspaceSlug: string, teamSlug: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(
      ROUTES.workspaces.teams.detail.build(this.orgSlug, workspaceSlug, teamSlug),
    );
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    // Team detail defaults to board view — wait for board columns or empty state
    await expect
      .poll(
        async () => {
          const columnCount = await getLocatorCount(this.boardColumns);
          if (columnCount > 0) return "ready";
          return (await isLocatorVisible(this.page.getByText(/no issues/i))) ? "empty" : "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }
}
