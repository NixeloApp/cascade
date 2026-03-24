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
  readonly issueCards: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.createIssueButton = page.getByRole("button", { name: /create issue/i });
    this.issueCards = page.getByTestId(TEST_IDS.ISSUE.CARD);
  }

  async goto() {
    await this.gotoPath(ROUTES.issues.list.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.createIssueButton.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          const cardCount = await getLocatorCount(this.issueCards);
          if (cardCount > 0) return "ready";
          return (await isLocatorVisible(this.page.getByText(/no issues found/i)))
            ? "empty"
            : "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }
}
