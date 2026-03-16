import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { ROUTES, routePattern } from "../utils/routes";
import { waitForIssueUpdateSuccess } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Page object for the standalone issue detail route: /$orgSlug/issues/$key
 */
export class IssueDetailPage extends BasePage {
  readonly editIssueButton: Locator;
  readonly issueTitleInput: Locator;
  readonly issueDescriptionEditor: Locator;
  readonly issueDescriptionContent: Locator;
  readonly saveChangesButton: Locator;
  readonly prioritySelect: Locator;
  readonly notFoundHeading: Locator;
  readonly notFoundMessage: Locator;
  readonly backToDashboardLink: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    this.editIssueButton = page.getByRole("button", { name: /edit issue/i });
    this.issueTitleInput = page.getByPlaceholder("Issue title");
    this.issueDescriptionEditor = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR);
    this.issueDescriptionContent = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT);
    this.saveChangesButton = page.getByRole("button", { name: /save changes/i });
    this.prioritySelect = page.getByLabel("Change priority");
    this.notFoundHeading = page.getByRole("heading", { name: /issue not found/i });
    this.notFoundMessage = page.getByText(/does not exist|don't have access/i);
    this.backToDashboardLink = page.getByRole("link", { name: /back to dashboard/i });
  }

  async goto(): Promise<void> {
    throw new Error("Use gotoIssue(issueKey) for the issue detail page.");
  }

  async gotoIssue(issueKey: string) {
    await this.page.goto(ROUTES.issues.detail.build(this.orgSlug, issueKey));
    await this.waitForLoad();
  }

  getProjectBreadcrumb(projectKey: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(projectKey, "i") });
  }

  async expectIssueLoaded(issueKey: string) {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(ROUTES.issues.detail.build(this.orgSlug, issueKey))}$`));
    await expect(
      this.page
        .locator("code")
        .filter({ hasText: new RegExp(`^${escapeRegExp(issueKey)}$`) })
        .first(),
    ).toBeVisible();
    await expect(this.editIssueButton).toBeVisible();
  }

  async expectIssueNotFound() {
    await expect(this.notFoundHeading).toBeVisible();
    await expect(this.notFoundMessage).toBeVisible();
    await expect(this.backToDashboardLink).toBeVisible();
  }

  async expectProjectBreadcrumbVisible(projectKey: string) {
    await expect(this.getProjectBreadcrumb(projectKey)).toBeVisible();
  }

  async returnToProjectBoard(projectKey: string) {
    await this.getProjectBreadcrumb(projectKey).click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.projects.board.path));
  }

  async enterEditMode() {
    if (await this.isInEditMode()) {
      return;
    }

    await expect(this.editIssueButton).toBeVisible();
    await expect(this.editIssueButton).toBeEnabled();
    await this.editIssueButton.click();

    if (await this.waitForEditMode()) {
      return;
    }

    await this.editIssueButton.click();
    await this.expectEditMode();
  }

  async saveEdits() {
    await expect(this.saveChangesButton).toBeVisible();
    await expect(this.saveChangesButton).toBeEnabled();
    await this.saveChangesButton.click();
  }

  async isInEditMode() {
    return (
      (await this.issueTitleInput.isVisible().catch(() => false)) ||
      (await this.issueDescriptionEditor.isVisible().catch(() => false))
    );
  }

  private async getEditModeState(): Promise<"edit" | "pending"> {
    if (
      (await this.issueTitleInput.isVisible().catch(() => false)) ||
      (await this.issueDescriptionEditor.isVisible().catch(() => false))
    ) {
      return "edit";
    }

    return "pending";
  }

  async waitForEditMode(timeout = 3000) {
    try {
      await expect
        .poll(() => this.getEditModeState(), {
          timeout,
          intervals: [200, 500, 1000],
        })
        .toBe("edit");
      return true;
    } catch {
      return false;
    }
  }

  async expectEditMode() {
    const editModeVisible = await this.waitForEditMode(10000);
    expect(editModeVisible).toBe(true);
  }

  async waitForSaveControls(timeout = 3000) {
    try {
      await this.saveChangesButton.waitFor({ state: "visible", timeout });
      await expect(this.saveChangesButton).toBeEnabled({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async editTitle(nextTitle: string) {
    await this.enterEditMode();
    await expect(this.issueTitleInput).toBeVisible();
    await this.issueTitleInput.fill(nextTitle);
    await expect(this.issueTitleInput).toHaveValue(nextTitle);

    if (!(await this.waitForSaveControls())) {
      await this.enterEditMode();
      await expect(this.issueTitleInput).toBeVisible();
      await this.issueTitleInput.fill(nextTitle);
      await expect(this.issueTitleInput).toHaveValue(nextTitle);
    }

    await this.saveEdits();
    await expect(this.issueTitleInput).not.toBeVisible();
    await expect(this.editIssueButton).toBeVisible();

    await waitForIssueUpdateSuccess(this.page);
  }

  async editDescription(nextDescription: string) {
    await this.enterEditMode();
    await expect(this.issueDescriptionEditor).toBeVisible();
    await this.issueDescriptionEditor.fill(nextDescription);

    if (!(await this.waitForSaveControls())) {
      await this.enterEditMode();
      await expect(this.issueDescriptionEditor).toBeVisible();
      await this.issueDescriptionEditor.fill(nextDescription);
    }

    await this.saveEdits();
    await expect(this.issueDescriptionEditor).not.toBeVisible();
    await expect(this.editIssueButton).toBeVisible();

    await waitForIssueUpdateSuccess(this.page);
    await expect(this.issueDescriptionContent).toContainText(nextDescription);
  }

  async changePriority(priorityLabel: string) {
    await expect(this.prioritySelect).toBeVisible();
    await this.prioritySelect.click();

    const option = this.page.getByRole("option", {
      name: new RegExp(`^${escapeRegExp(priorityLabel)}$`, "i"),
    });
    await expect(option).toBeVisible();
    await option.click();

    await expect(this.prioritySelect).toContainText(new RegExp(priorityLabel, "i"));
    await waitForIssueUpdateSuccess(this.page);
  }
}
