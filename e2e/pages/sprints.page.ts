import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { BasePage } from "./base.page";

/**
 * Sprints Page Object
 * Handles the sprint management view with sprint cards and creation form.
 */
export class SprintsPage extends BasePage {
  readonly completeSprintButton: Locator;
  readonly completionDialog: Locator;
  readonly completionDialogDescription: Locator;
  readonly pageHeader: Locator;
  readonly createButton: Locator;
  readonly sprintCards: Locator;
  readonly emptyState: Locator;
  readonly createForm: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.completeSprintButton = page
      .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
      .getByRole("button", { name: /^complete sprint$/i })
      .first();
    this.completionDialog = page.getByRole("dialog", { name: /^complete sprint$/i });
    this.completionDialogDescription = this.completionDialog.getByText(
      /issues? not completed\. choose what to do with them\./i,
    );
    this.pageHeader = page.getByTestId(TEST_IDS.SPRINT.PAGE_HEADER);
    this.createButton = page.getByTestId(TEST_IDS.SPRINT.CREATE_BUTTON);
    this.sprintCards = page.getByTestId(TEST_IDS.SPRINT.CARD);
    this.emptyState = page.getByTestId(TEST_IDS.SPRINT.EMPTY_STATE);
    this.createForm = page.getByTestId(TEST_IDS.SPRINT.CREATE_FORM);
  }

  async goto() {
    throw new Error("SprintsPage.goto() requires a project key — use gotoProject() instead");
  }

  async gotoProject(projectKey: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(ROUTES.projects.sprints.build(this.orgSlug, projectKey));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.emptyState)) return "empty";
          if ((await this.sprintCards.count()) > 0) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }

  async openCompletionDialog(): Promise<void> {
    await this.completeSprintButton.waitFor({ state: "visible", timeout: 5000 });
    await this.completeSprintButton.click();
    await this.completionDialog.waitFor({ state: "visible", timeout: 5000 });
    await this.completionDialogDescription.waitFor({ state: "visible", timeout: 5000 });
  }
}
