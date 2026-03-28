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
  readonly anyStartSprintButton: Locator;
  readonly anyCompleteSprintButton: Locator;
  readonly startDialog: Locator;
  readonly startDateInput: Locator;
  readonly startEndDateInput: Locator;
  readonly startOverlapWarning: Locator;
  readonly startConfirmButton: Locator;
  readonly completionDialog: Locator;
  readonly completionDialogDescription: Locator;
  readonly pageHeader: Locator;
  readonly createButton: Locator;
  readonly createNameInput: Locator;
  readonly createSubmitButton: Locator;
  readonly sprintCards: Locator;
  readonly emptyState: Locator;
  readonly createForm: Locator;
  readonly workloadTrigger: Locator;
  readonly workloadPopover: Locator;
  readonly burndownToggle: Locator;
  readonly burnupToggle: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.anyStartSprintButton = page.getByTestId(TEST_IDS.SPRINT.START_TRIGGER).first();
    this.anyCompleteSprintButton = page.getByTestId(TEST_IDS.SPRINT.COMPLETE_TRIGGER).first();
    this.startDialog = page.getByTestId(TEST_IDS.SPRINT.START_DIALOG);
    this.startDateInput = page.getByTestId(TEST_IDS.SPRINT.START_DATE_INPUT);
    this.startEndDateInput = page.getByTestId(TEST_IDS.SPRINT.START_END_DATE_INPUT);
    this.startOverlapWarning = page.getByTestId(TEST_IDS.SPRINT.START_OVERLAP_WARNING);
    this.startConfirmButton = page.getByTestId(TEST_IDS.SPRINT.START_CONFIRM_BUTTON);
    this.completionDialog = page.getByTestId(TEST_IDS.SPRINT.COMPLETE_DIALOG);
    this.completionDialogDescription = this.completionDialog.getByText(
      /issues? not completed\. choose what to do with them\./i,
    );
    this.pageHeader = page.getByTestId(TEST_IDS.SPRINT.PAGE_HEADER);
    this.createButton = page.getByTestId(TEST_IDS.SPRINT.CREATE_BUTTON);
    this.createNameInput = page.getByTestId(TEST_IDS.SPRINT.CREATE_NAME_INPUT);
    this.createSubmitButton = page.getByTestId(TEST_IDS.SPRINT.CREATE_SUBMIT_BUTTON);
    this.sprintCards = page.getByTestId(TEST_IDS.SPRINT.CARD);
    this.emptyState = page.getByTestId(TEST_IDS.SPRINT.EMPTY_STATE);
    this.createForm = page.getByTestId(TEST_IDS.SPRINT.CREATE_FORM);
    this.workloadTrigger = page.getByTestId(TEST_IDS.SPRINT.WORKLOAD_TRIGGER).first();
    this.workloadPopover = page.getByTestId(TEST_IDS.SPRINT.WORKLOAD_POPOVER);
    this.burndownToggle = page.getByTestId(TEST_IDS.SPRINT.CHART_BURNDOWN_TOGGLE).first();
    this.burnupToggle = page.getByTestId(TEST_IDS.SPRINT.CHART_BURNUP_TOGGLE).first();
  }

  async goto() {
    throw new Error("SprintsPage.goto() requires a project key — use gotoProject() instead");
  }

  async gotoProject(projectKey: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(ROUTES.projects.sprints.build(this.orgSlug, projectKey));
    await this.waitForLoad();
  }

  async gotoProjectAndWait(projectKey: string) {
    await this.gotoProject(projectKey);
    await this.waitUntilReady();
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

  async openCompletionDialog(sprintName?: string): Promise<void> {
    const button = sprintName ? this.getCompleteButton(sprintName) : this.anyCompleteSprintButton;
    await button.waitFor({ state: "visible", timeout: 5000 });
    await button.click();
    await this.completionDialog.waitFor({ state: "visible", timeout: 5000 });
    await this.completionDialogDescription.waitFor({ state: "visible", timeout: 5000 });
  }

  getStartButton(sprintName: string): Locator {
    return this.getSprintCard(sprintName).getByTestId(TEST_IDS.SPRINT.START_TRIGGER);
  }

  getCompleteButton(sprintName: string): Locator {
    return this.getSprintCard(sprintName).getByTestId(TEST_IDS.SPRINT.COMPLETE_TRIGGER);
  }

  getStartPresetButton(presetId: string): Locator {
    return this.page.getByTestId(TEST_IDS.SPRINT.START_PRESET(presetId));
  }

  async ensureFutureSprintReady(name = "Overlap Warning Sprint"): Promise<void> {
    const button = this.getStartButton(name);
    if (await isLocatorVisible(this.anyStartSprintButton)) {
      return;
    }

    await this.createButton.waitFor({ state: "visible", timeout: 5000 });
    await this.createButton.click();
    await this.createForm.waitFor({ state: "visible", timeout: 5000 });
    await this.createNameInput.fill(name);
    await this.createSubmitButton.click();
    await button.waitFor({ state: "visible", timeout: 5000 });
  }

  async openStartDialog(sprintName?: string): Promise<void> {
    const button = sprintName ? this.getStartButton(sprintName) : this.anyStartSprintButton;
    await button.waitFor({ state: "visible", timeout: 5000 });
    await button.click();
    await this.startDialog.waitFor({ state: "visible", timeout: 5000 });
  }

  async chooseStartPreset(presetId: string): Promise<void> {
    const presetButton = this.getStartPresetButton(presetId);
    await presetButton.waitFor({ state: "visible", timeout: 5000 });
    await presetButton.click();
  }

  async switchChartMode(mode: "burndown" | "burnup"): Promise<void> {
    const toggle = mode === "burndown" ? this.burndownToggle : this.burnupToggle;
    await toggle.waitFor({ state: "visible", timeout: 5000 });
    await toggle.click();
  }

  async openWorkloadPopover(): Promise<void> {
    await this.workloadTrigger.waitFor({ state: "visible", timeout: 5000 });
    await this.workloadTrigger.click();
    await this.workloadPopover.waitFor({ state: "visible", timeout: 5000 });
  }

  private getSprintCard(sprintName: string): Locator {
    return this.sprintCards
      .filter({
        has: this.page.getByTestId(TEST_IDS.SPRINT.NAME).filter({ hasText: sprintName }),
      })
      .first();
  }
}
