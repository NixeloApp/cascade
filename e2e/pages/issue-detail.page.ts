import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { waitForIssueUpdateSuccess } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

const EDIT_RETRY_INTERVALS = [1000];
const EDIT_RETRY_TIMEOUT = 20000;

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

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    this.editIssueButton = page.getByRole("button", { name: /edit issue/i });
    this.issueTitleInput = page.getByPlaceholder("Issue title");
    this.issueDescriptionEditor = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR);
    this.issueDescriptionContent = page.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT);
    this.saveChangesButton = page.getByRole("button", { name: /save changes/i });
    this.prioritySelect = page.getByLabel("Change priority");
  }

  async goto(): Promise<void> {
    throw new Error("Use gotoIssue(issueKey) for the issue detail page.");
  }

  async gotoIssue(issueKey: string) {
    await this.page.goto(`/${this.orgSlug}/issues/${issueKey}`);
    await this.waitForLoad();
  }

  getProjectBreadcrumb(projectKey: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(projectKey, "i") });
  }

  async editTitle(nextTitle: string) {
    await expect(async () => {
      if (!(await this.issueTitleInput.isVisible().catch(() => false))) {
        await this.editIssueButton.click();
      }

      await expect(this.issueTitleInput).toBeVisible();
      await this.issueTitleInput.fill(nextTitle);
      await expect(this.issueTitleInput).toHaveValue(nextTitle);
      await expect(this.saveChangesButton).toBeVisible();
      await this.saveChangesButton.click();
      await expect(this.issueTitleInput).not.toBeVisible();
      await expect(this.editIssueButton).toBeVisible();
    }).toPass({ timeout: EDIT_RETRY_TIMEOUT, intervals: EDIT_RETRY_INTERVALS });
  }

  async editDescription(nextDescription: string) {
    await expect(async () => {
      if (!(await this.issueDescriptionEditor.isVisible().catch(() => false))) {
        await this.editIssueButton.click();
      }

      await expect(this.issueDescriptionEditor).toBeVisible();
      await this.issueDescriptionEditor.fill(nextDescription);
      await expect(this.saveChangesButton).toBeVisible();
      await this.saveChangesButton.click();
      await expect(this.issueDescriptionEditor).not.toBeVisible();
      await expect(this.editIssueButton).toBeVisible();
    }).toPass({ timeout: EDIT_RETRY_TIMEOUT, intervals: EDIT_RETRY_INTERVALS });

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
