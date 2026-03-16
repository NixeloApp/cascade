import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ROUTES, routePattern } from "../utils/routes";
import { TEST_IDS } from "../../src/lib/test-ids";
import {
  createWorkspaceFromDialog,
  dismissWorkspaceDialogIfOpen,
  getWorkspaceDialogElements,
  waitForBoardLoaded,
  waitForIssueCreateSuccess,
  waitForIssueUpdateSuccess,
  waitForProjectCreateSuccess,
} from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Projects Page Object
 * Handles the projects view with sidebar and kanban board
 * Note: UI uses "Projects" terminology, URLs use /projects/ path
 */
export class ProjectsPage extends BasePage {
  // ===================
  // Locators - Sidebar
  // ===================
  readonly sidebar: Locator;
  readonly newProjectButton: Locator;
  readonly newWorkspaceButton: Locator;
  readonly createEntityButton: Locator; // Alias for sidebar "Add new project" or "Create Workspace" button
  readonly projectList: Locator;
  readonly projectItems: Locator;

  // ===================
  // Locators - Create Project Form
  // ===================
  readonly createProjectForm: Locator;
  readonly templateOptionButtons: Locator;
  readonly projectNameInput: Locator;
  readonly projectKeyInput: Locator;
  readonly projectDescriptionInput: Locator;
  readonly makePublicCheckbox: Locator;
  readonly boardTypeKanban: Locator;
  readonly boardTypeScrum: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  // ===================
  // Locators - Project Board
  // ===================
  readonly projectBoard: Locator;
  readonly boardColumns: Locator;
  readonly issueCards: Locator;
  readonly createIssueButton: Locator;

  // ===================
  // Locators - Create Issue Modal
  // ===================
  readonly createIssueModal: Locator;
  readonly issueTitleInput: Locator;
  readonly issueDescriptionInput: Locator;
  readonly issueTypeSelect: Locator;
  readonly issuePrioritySelect: Locator;
  readonly issueAssigneeSelect: Locator;
  readonly createIssueForm: Locator;
  readonly submitIssueButton: Locator;

  // ===================
  // Locators - Project Tabs
  // ===================
  readonly projectTabs: Locator;
  readonly boardTab: Locator;
  readonly backlogTab: Locator;
  readonly calendarTab: Locator;
  readonly timesheetTab: Locator;
  readonly roadmapTab: Locator;
  readonly sprintsTab: Locator;
  readonly activityTab: Locator;
  readonly analyticsTab: Locator;
  readonly settingsTab: Locator;
  readonly timesheetEntriesTab: Locator;
  readonly sprintsPageHeader: Locator;
  readonly createSprintButton: Locator;
  readonly sprintsEmptyState: Locator;
  readonly sprintCards: Locator;

  // ===================
  // Locators - Activity Feed
  // ===================
  readonly activityPageHeader: Locator;
  readonly activityFeed: Locator;
  readonly activityEmptyState: Locator;
  readonly activityEntries: Locator;

  // ===================
  // Locators - Analytics
  // ===================
  readonly analyticsPageHeader: Locator;
  readonly analyticsPageDescription: Locator;
  readonly analyticsTotalIssuesMetric: Locator;
  readonly analyticsUnassignedMetric: Locator;
  readonly analyticsAvgVelocityMetric: Locator;
  readonly analyticsCompletedSprintsMetric: Locator;
  readonly analyticsIssuesByStatusChart: Locator;
  readonly analyticsIssuesByTypeChart: Locator;
  readonly analyticsIssuesByPriorityChart: Locator;
  readonly analyticsTeamVelocityChart: Locator;
  readonly analyticsNoCompletedSprintsMessage: Locator;
  readonly roadmapViewToggle: Locator;
  readonly roadmapEpicFilter: Locator;
  readonly projectSettingsHeader: Locator;

  // ===================
  // Locators - Issue Detail Dialog
  // ===================
  readonly issueDetailDialog: Locator;
  readonly issueDetailEditButton: Locator;
  readonly issueDetailTitleInput: Locator;
  readonly issueDetailDescriptionEditor: Locator;
  readonly issueDetailDescriptionContent: Locator;
  readonly issueDetailSaveChangesButton: Locator;
  readonly issueDetailPrioritySelect: Locator;
  readonly startTimerButton: Locator;
  readonly stopTimerButton: Locator;
  readonly timerStartedToast: Locator;
  readonly timerStoppedToast: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.getByRole("complementary"));
    // Scope to main content area and take first match (header action or empty-state action)
    // Both trigger the same create-project modal, so either is valid
    this.newProjectButton = page
      .getByRole("main")
      .getByRole("button", { name: /^\+?\s*create project$/i })
      .first();
    this.newWorkspaceButton = page.getByRole("button", { name: "+ Create Workspace" });
    this.createEntityButton = this.sidebar.getByRole("button", {
      name: /add new|create|\+/i,
    });
    this.projectList = page
      .locator("[data-project-list]")
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.projectItems = page
      .locator("[data-project-item]")
      .or(this.sidebar.getByRole("button").filter({ hasNotText: /new|add/i }));

    // Create project form - look for dialog content
    // Fallback to role since test-id might be stripped or unreliable in some interactions
    this.createProjectForm = page
      .getByRole("dialog")
      .filter({ has: page.getByTestId(TEST_IDS.PROJECT.CREATE_MODAL) });

    // Template selection
    // Select from stable modal content instead of hardcoding template display names
    this.templateOptionButtons = this.createProjectForm.locator("li").getByRole("button");

    this.projectNameInput = page.getByTestId(TEST_IDS.PROJECT.NAME_INPUT);
    this.projectKeyInput = page.getByTestId(TEST_IDS.PROJECT.KEY_INPUT);
    this.projectDescriptionInput = page.getByLabel(/description/i);
    this.makePublicCheckbox = page.getByRole("checkbox", { name: /public/i });

    // Board type is now part of template, but keeping locators just in case
    this.boardTypeKanban = page.getByRole("radio", { name: /kanban/i });
    this.boardTypeScrum = page.getByRole("radio", { name: /scrum/i });

    // Button in the modal
    this.createButton = this.createProjectForm.getByRole("button", {
      name: /create project/i,
    });
    this.cancelButton = this.createProjectForm.getByRole("button", { name: /cancel/i });

    // Project board - look for Kanban Board heading or board container
    this.projectBoard = page
      .locator("[data-project-board]")
      .or(page.getByRole("heading", { name: /kanban board|scrum board/i }));
    this.boardColumns = page.getByTestId(TEST_IDS.BOARD.COLUMN);
    this.issueCards = page.getByTestId(TEST_IDS.ISSUE.CARD);
    // Create issue - prefer the stable first-column trigger used by the tour,
    // fall back to "Add issue" or empty-state "Add first issue" button.
    this.createIssueButton = page
      .locator("[data-tour='create-issue']")
      .or(page.getByRole("button", { name: /add (first )?issue/i }))
      .first();

    // Create issue modal
    this.createIssueModal = page
      .getByRole("dialog")
      .filter({ hasText: /create.*issue|new.*issue/i });
    this.issueTitleInput = this.createIssueModal
      .getByPlaceholder(/title|issue.*title/i)
      .or(this.createIssueModal.getByRole("textbox", { name: /title/i }))
      .first();
    this.issueDescriptionInput = this.createIssueModal
      .getByPlaceholder(/description/i)
      .or(this.createIssueModal.locator("[data-issue-description]"))
      .first();
    this.issueTypeSelect = this.createIssueModal.getByRole("combobox", { name: /type/i }).first();
    this.issuePrioritySelect = this.createIssueModal
      .getByRole("combobox", { name: /priority/i })
      .first();
    this.issueAssigneeSelect = this.createIssueModal
      .getByRole("combobox", { name: /assignee/i })
      .first();
    this.createIssueForm = this.createIssueModal.locator("form").first();
    this.submitIssueButton = this.createIssueModal
      .getByRole("button", { name: /^create issue$/i })
      .or(this.createIssueModal.locator('button[type="submit"]'));

    // Project tabs - scope to the project tab strip to avoid collisions with global nav links.
    // There are separate mobile (sm:hidden) and desktop (sm:flex) navs, so use .first() to
    // get whichever is in DOM order (mobile) - the actual tab link clicks work on either.
    this.projectTabs = page.getByRole("navigation", { name: "Project sections" }).first();
    this.boardTab = this.projectTabs.getByRole("link", { name: /^Board$/ });
    this.backlogTab = this.projectTabs.getByRole("link", { name: /^Backlog$/ });
    this.calendarTab = this.projectTabs.getByRole("link", { name: /^Calendar$/ });
    this.timesheetTab = this.projectTabs.getByRole("link", { name: /^Timesheet$/ });
    this.roadmapTab = this.projectTabs.getByRole("link", { name: /^Roadmap$/ });
    this.sprintsTab = this.projectTabs.getByRole("link", { name: /^Sprints$/ });
    this.activityTab = this.projectTabs.getByRole("link", { name: /^Activity$/ });
    this.analyticsTab = this.projectTabs.getByRole("link", { name: /^Analytics$/ });
    this.settingsTab = this.projectTabs.getByRole("link", { name: /^Settings$/ });
    this.timesheetEntriesTab = page.getByRole("tab", { name: /time entries/i });
    this.sprintsPageHeader = page.getByRole("heading", { name: /sprint management/i });
    this.createSprintButton = page.getByRole("button", { name: /^create sprint$/i }).first();
    this.sprintsEmptyState = page.getByText(/no sprints yet/i);
    this.sprintCards = page.getByTestId(TEST_IDS.SPRINT.CARD);

    // Activity feed
    this.activityPageHeader = page.getByRole("heading", { name: /project activity/i });
    this.activityFeed = page.getByTestId(TEST_IDS.ACTIVITY.FEED);
    this.activityEmptyState = page.getByTestId(TEST_IDS.ACTIVITY.EMPTY_STATE);
    this.activityEntries = this.activityFeed.getByTestId(TEST_IDS.ACTIVITY.ENTRY);

    // Analytics
    this.analyticsPageHeader = page.getByRole("heading", { name: /analytics dashboard/i });
    this.analyticsPageDescription = page.getByText(/project insights.*velocity.*metrics/i);
    this.analyticsTotalIssuesMetric = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES);
    this.analyticsUnassignedMetric = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_UNASSIGNED);
    this.analyticsAvgVelocityMetric = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_AVG_VELOCITY);
    this.analyticsCompletedSprintsMetric = page.getByTestId(
      TEST_IDS.ANALYTICS.METRIC_COMPLETED_SPRINTS,
    );
    this.analyticsIssuesByStatusChart = page.getByText("Issues by Status");
    this.analyticsIssuesByTypeChart = page.getByText("Issues by Type");
    this.analyticsIssuesByPriorityChart = page.getByText("Issues by Priority");
    this.analyticsTeamVelocityChart = page.getByText("Team Velocity (Last 10 Sprints)");
    this.analyticsNoCompletedSprintsMessage = page.getByText("No completed sprints yet");
    this.roadmapViewToggle = page.getByRole("group").filter({ hasText: /months|weeks/i });
    this.roadmapEpicFilter = page.getByRole("combobox").filter({ hasText: /epic|all/i });
    this.projectSettingsHeader = page.getByRole("heading", { name: /project settings/i });
    // Issue detail dialog
    // Issue detail dialog - distinct from Create Issue modal
    this.issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    this.issueDetailEditButton = this.issueDetailDialog.getByRole("button", { name: /^Edit$/ });
    this.issueDetailTitleInput = this.issueDetailDialog.getByPlaceholder("Issue title");
    this.issueDetailDescriptionEditor = this.issueDetailDialog.getByTestId(
      TEST_IDS.ISSUE.DESCRIPTION_EDITOR,
    );
    this.issueDetailDescriptionContent = this.issueDetailDialog.getByTestId(
      TEST_IDS.ISSUE.DESCRIPTION_CONTENT,
    );
    this.issueDetailSaveChangesButton = this.issueDetailDialog.getByRole("button", {
      name: /save changes/i,
    });
    this.issueDetailPrioritySelect = this.issueDetailDialog.getByLabel("Change priority");
    this.startTimerButton = this.issueDetailDialog.getByRole("button", { name: "Start Timer" });
    this.stopTimerButton = this.issueDetailDialog.getByRole("button", { name: /stop timer|stop/i });
    this.timerStartedToast = this.getToast("Timer started");
    this.timerStoppedToast = this.getToast("Timer stopped");
  }

  /**
   * Get the project settings link specifically from the project navigation (top bar)
   * Scoped to "main" to avoid confusing it with global settings or sidebar items
   */
  getProjectSettingsTab() {
    return this.projectTabs.getByRole("link", { name: "Settings" });
  }

  getProjectTab(
    tab:
      | "board"
      | "backlog"
      | "calendar"
      | "timesheet"
      | "roadmap"
      | "sprints"
      | "activity"
      | "analytics"
      | "settings",
  ) {
    const tabs = {
      board: this.boardTab,
      backlog: this.backlogTab,
      calendar: this.calendarTab,
      timesheet: this.timesheetTab,
      roadmap: this.roadmapTab,
      sprints: this.sprintsTab,
      activity: this.activityTab,
      analytics: this.analyticsTab,
      settings: this.settingsTab,
    };

    return tabs[tab];
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.navigateToProjectsRoute();
    await this.expectProjectsView();
  }

  async gotoProjectBoard(projectKey: string) {
    await this.gotoPath(`/${this.orgSlug}/projects/${projectKey}/board`);
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async openCreateProjectForm() {
    console.log("Clicking 'Create Project' button...");

    await this.closeCreateProjectFormIfOpen();
    await this.ensureProjectsView();
    await this.clickNewProjectButton();

    if (await this.waitForCreateProjectWizardReady()) {
      console.log("Create project modal visible.");
      return;
    }

    // Check if modal is already open but still pending before re-clicking
    if (await this.createProjectForm.isVisible().catch(() => false)) {
      await this.expectCreateProjectWizardReady();
    } else {
      await this.ensureProjectsView();
      await this.clickNewProjectButton();
      await this.expectCreateProjectWizardReady();
    }

    console.log("Create project modal visible.");
  }

  async createProject(name: string, key: string, description?: string) {
    await this.openCreateProjectForm();

    try {
      const configureHeading = this.createProjectForm.getByRole("heading", {
        name: /configure project/i,
      });
      await this.ensureCreateProjectConfigureStep();

      await expect(configureHeading).toBeVisible();

      // Step 2: Fill in project details
      await this.projectNameInput.waitFor({ state: "visible" });
      await this.projectNameInput.fill(name);
      await expect(this.projectNameInput).toHaveValue(name);

      await this.projectKeyInput.waitFor({ state: "visible" });
      await this.projectKeyInput.fill(key);
      await expect(this.projectKeyInput).toHaveValue(key.toUpperCase());

      if (description) {
        await this.projectDescriptionInput.fill(description);
      }

      const normalizedProjectKey = key.toUpperCase();
      const boardPath = `/${this.orgSlug}/projects/${normalizedProjectKey}/board`;
      const boardUrlPattern = new RegExp(`/projects/${normalizedProjectKey}/board(?:[/?#]|$)`);

      await this.createButton.waitFor({ state: "visible" });
      await expect(this.createButton).toBeEnabled();
      await this.createButton.scrollIntoViewIfNeeded();

      await this.submitCreateProject();

      await waitForProjectCreateSuccess(this.page);

      if (!boardUrlPattern.test(this.page.url())) {
        await this.gotoPath(boardPath);
      }

      await expect(this.page).toHaveURL(boardUrlPattern);

      // Wait for board to be fully interactive before returning
      await this.waitForBoardInteractive();
    } catch (e) {
      console.error("Failed to create project from template:", e);
      // Log the current URL to help debugging
      console.log("Current URL:", this.page.url());
      throw e;
    }
  }

  async createWorkspace(name: string, description?: string) {
    // Navigate to workspaces page using sidebar to ensure correct context
    await this.page.locator("nav").getByText("Workspaces", { exact: true }).click();
    await this.page.waitForURL(/\/workspaces/, { timeout: 30000 });

    const { dialog, createForm, descriptionInput, nameInput, submitButton } =
      getWorkspaceDialogElements(this.page);

    await createWorkspaceFromDialog({
      dialog,
      nameInput,
      descriptionInput,
      submitButton,
      createForm,
      workspaceName: name,
      workspaceDescription: description,
      openDialog: async () => {
        await dismissWorkspaceDialogIfOpen(this.page, dialog);
        await expect(this.newWorkspaceButton).toBeVisible();
        await this.newWorkspaceButton.scrollIntoViewIfNeeded();
        await this.newWorkspaceButton.click();
      },
    });

    // Deterministic completion: modal closes and workspace route remains active.
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.workspaces.list.path),
    );
  }

  async cancelCreateProject() {
    await this.closeCreateProjectFormIfOpen();
    await expect(this.createProjectForm).not.toBeVisible();
  }

  async selectProject(index: number) {
    const item = this.projectItems.nth(index);
    await item.click();
  }

  async openCreateIssueModal() {
    if (await this.tryOpenCreateIssueModal(2000, 4000)) {
      return;
    }

    if (await this.tryOpenCreateIssueModal(5000, 6000)) {
      return;
    }

    await expect(this.createIssueModal).toBeVisible();
    await this.expectCreateIssueModalReady();
  }

  private async findVisibleCreateIssueTrigger(timeout = 2000): Promise<Locator | null> {
    const triggerCandidates = [
      this.page.getByRole("button", { name: /add first issue/i }).first(),
      this.page.locator("[data-tour='create-issue']").first(),
      this.page.getByRole("button", { name: /add issue/i }).first(),
    ];

    for (const trigger of triggerCandidates) {
      if ((await trigger.count().catch(() => 0)) === 0) {
        continue;
      }

      await trigger.waitFor({ state: "visible", timeout }).catch(() => {});
      if (await trigger.isVisible().catch(() => false)) {
        return trigger;
      }
    }

    return null;
  }

  private async tryOpenCreateIssueModal(triggerTimeout = 2000, readyTimeout = 4000) {
    const trigger = await this.findVisibleCreateIssueTrigger(triggerTimeout);
    if (!trigger) {
      return false;
    }

    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.click();
    return this.waitForCreateIssueModalReady(readyTimeout);
  }

  async createIssue(title: string, type?: string, priority?: string) {
    await this.openCreateIssueModal();
    await this.issueTitleInput.fill(title);
    if (type) {
      await this.issueTypeSelect.selectOption(type);
    }
    if (priority) {
      await this.issuePrioritySelect.selectOption(priority);
    }
    await expect(this.submitIssueButton).toBeVisible();
    await expect(this.submitIssueButton).toBeEnabled();
    await this.submitCreateIssue();

    await waitForIssueCreateSuccess(this.page, title);
  }

  private async submitCreateIssue() {
    await expect(this.submitIssueButton).toBeVisible();
    await expect(this.submitIssueButton).toBeEnabled();
    await this.submitIssueButton.scrollIntoViewIfNeeded().catch(() => {});
    await this.submitIssueButton.click();

    // Don't retry non-idempotent issue creation - wait longer for submit state instead
    await this.expectCreateIssueSubmitStarted(8000);
  }

  private async expectCreateIssueSubmitStarted(timeout = 10000) {
    await expect
      .poll(async () => this.getCreateIssueSubmitState(), {
        timeout,
        intervals: [200, 500, 1000],
      })
      .not.toBe("open");
  }

  private async getCreateIssueSubmitState() {
    if (!(await this.createIssueModal.isVisible().catch(() => false))) {
      return "closed";
    }

    if (await this.submitIssueButton.isDisabled().catch(() => false)) {
      return "submitting";
    }

    return "open";
  }

  private async waitForCreateIssueModalReady(timeout = 12000) {
    try {
      await this.expectCreateIssueModalReady(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async expectCreateIssueModalReady(timeout = 12000) {
    await this.createIssueModal.waitFor({ state: "visible", timeout });
    await this.issueTitleInput
      .or(this.submitIssueButton)
      .or(this.createIssueModal.getByRole("button", { name: /get ai suggestions/i }))
      .or(this.issueTypeSelect)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  async switchToTab(
    tab:
      | "board"
      | "backlog"
      | "calendar"
      | "timesheet"
      | "roadmap"
      | "sprints"
      | "activity"
      | "analytics"
      | "settings",
  ) {
    const tabLocator = this.getProjectTab(tab);

    // Wait for tab to be available - handle potential loading states or animations
    await expect(tabLocator).toBeVisible();

    // Ensure the tab is actually clickable before attempting to click
    // Add a check for navigation container to ensure hydration is complete
    await expect(this.projectTabs).toBeVisible();
    await expect(tabLocator).toBeEnabled();

    await tabLocator.click();

    const tabPaths = {
      board: /\/board(?:[/?#]|$)/,
      backlog: /\/backlog(?:[/?#]|$)/,
      calendar: /\/calendar(?:[/?#]|$)/,
      timesheet: /\/timesheet(?:[/?#]|$)/,
      roadmap: /\/roadmap(?:[/?#]|$)/,
      sprints: /\/sprints(?:[/?#]|$)/,
      activity: /\/activity(?:[/?#]|$)/,
      analytics: /\/analytics(?:[/?#]|$)/,
      settings: /\/settings(?:[/?#]|$)/,
    };

    await expect(this.page).toHaveURL(tabPaths[tab]);

    if (tab === "board") {
      await this.waitForBoardInteractive();
      return;
    }

    if (tab === "activity") {
      await expect(this.activityPageHeader).toBeVisible();
      await expect(this.activityEmptyState.or(this.activityFeed)).toBeVisible();
      return;
    }

    if (tab === "calendar") {
      return;
    }

    if (tab === "backlog") {
      await this.expectBacklogLoaded();
      return;
    }

    if (tab === "timesheet") {
      await this.expectTimesheetLoaded();
      return;
    }

    if (tab === "roadmap") {
      await this.expectRoadmapLoaded();
      return;
    }

    if (tab === "sprints") {
      await this.expectSprintsLoaded();
      return;
    }

    if (tab === "analytics") {
      await this.expectAnalyticsLoaded();
      return;
    }

    if (tab === "settings") {
      await this.expectProjectSettingsLoaded();
    }
  }

  async isProjectTabVisible(
    tab:
      | "board"
      | "backlog"
      | "calendar"
      | "timesheet"
      | "roadmap"
      | "sprints"
      | "activity"
      | "analytics"
      | "settings",
  ) {
    return this.getProjectTab(tab)
      .isVisible()
      .catch(() => false);
  }

  async expectProjectTabCurrent(
    tab:
      | "board"
      | "backlog"
      | "calendar"
      | "timesheet"
      | "roadmap"
      | "sprints"
      | "activity"
      | "analytics"
      | "settings",
  ) {
    await expect(this.getProjectTab(tab)).toHaveAttribute("aria-current", "page");
  }

  async expectAnalyticsLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.analytics.path),
    );
    await expect(this.analyticsPageHeader).toBeVisible();
    await expect(this.analyticsTotalIssuesMetric).toBeVisible();
  }

  async expectAnalyticsMetricsVisible() {
    await this.expectAnalyticsLoaded();
    await expect(this.analyticsUnassignedMetric).toBeVisible();
    await expect(this.analyticsAvgVelocityMetric).toBeVisible();
    await expect(this.analyticsCompletedSprintsMetric).toBeVisible();
  }

  async expectAnalyticsChartsVisible() {
    await this.expectAnalyticsLoaded();
    await expect(this.analyticsIssuesByStatusChart).toBeVisible();
    await expect(this.analyticsIssuesByTypeChart).toBeVisible();
    await expect(this.analyticsIssuesByPriorityChart).toBeVisible();
    await this.analyticsTeamVelocityChart.scrollIntoViewIfNeeded();
    await expect(this.analyticsTeamVelocityChart).toBeVisible();
  }

  async getAnalyticsTotalIssuesCount() {
    await this.expectAnalyticsLoaded();
    const valueText = (await this.analyticsTotalIssuesMetric.textContent()) ?? "";
    return Number.parseInt(valueText.match(/\d+/)?.[0] ?? "0", 10);
  }

  async expectAnalyticsNoCompletedSprintsVisible() {
    await this.expectAnalyticsLoaded();
    await expect(this.analyticsNoCompletedSprintsMessage).toBeVisible();
  }

  async expectAnalyticsHeaderAndDescriptionVisible() {
    await this.expectAnalyticsLoaded();
    await expect(this.analyticsPageDescription).toBeVisible();
  }

  async expectProjectSettingsLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.settings.path),
    );
    await expect(this.projectSettingsHeader).toBeVisible();
  }

  async expectBacklogLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.backlog.path),
    );
    await expect(this.boardColumns.first()).toBeVisible();
    await expect(this.getBoardColumn("Backlog")).toBeVisible();
  }

  async expectTimesheetLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.timesheet.path),
    );
    await expect(this.timesheetEntriesTab).toBeVisible();
  }

  async expectRoadmapLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.roadmap.path),
    );
    await expect(this.roadmapViewToggle).toBeVisible();
  }

  async expectRoadmapCurrentMonthVisible(date = new Date()) {
    await this.expectRoadmapLoaded();
    const currentMonth = date.toLocaleString("default", { month: "short" });
    await expect(this.page.getByText(currentMonth)).toBeVisible();
  }

  async getRoadmapEpicFilterState(): Promise<"visible" | "hidden"> {
    await this.expectRoadmapLoaded();
    return (await this.roadmapEpicFilter.isVisible().catch(() => false)) ? "visible" : "hidden";
  }

  async expectSprintsLoaded() {
    await expect(this.page).toHaveURL(
      routePattern(ROUTES.projects.sprints.path),
    );
    await expect(this.sprintsPageHeader).toBeVisible();

    if (await this.createSprintButton.isVisible().catch(() => false)) {
      return;
    }

    if (await this.sprintsEmptyState.isVisible().catch(() => false)) {
      return;
    }

    if (
      await this.sprintCards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    await expect(
      this.createSprintButton.or(this.sprintsEmptyState).or(this.sprintCards.first()),
    ).toBeVisible();
  }

  async expectCreateSprintVisible() {
    await this.expectSprintsLoaded();
    await expect(this.createSprintButton).toBeVisible();
  }

  async getActivityPageState(): Promise<"empty" | "entries"> {
    await expect(this.activityPageHeader).toBeVisible();

    if (
      await this.activityEntries
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return "entries";
    }

    if (await this.activityEmptyState.isVisible().catch(() => false)) {
      return "empty";
    }

    await expect(this.activityEmptyState.or(this.activityEntries.first())).toBeVisible();

    return (await this.activityEntries
      .first()
      .isVisible()
      .catch(() => false))
      ? "entries"
      : "empty";
  }

  async expectActivityEntriesVisible() {
    await expect(this.activityFeed).toBeVisible();
    await expect(this.activityEntries.first()).toBeVisible();
  }

  async expectActivityActionVisible(actionPattern: RegExp) {
    await this.expectActivityEntriesVisible();
    await expect(this.activityFeed.getByText(actionPattern).first()).toBeVisible();
  }

  async expectActivityIssueKeyVisible(projectKey: string) {
    await this.expectActivityEntriesVisible();
    await expect(
      this.activityFeed.getByText(new RegExp(`${projectKey}-\\d+`)).first(),
    ).toBeVisible();
  }

  async expectActivityEntryActionVisible(actionPattern: RegExp) {
    const activityEntry = this.activityEntries.first();
    await expect(activityEntry).toBeVisible();
    await expect(activityEntry.getByText(actionPattern)).toBeVisible();
  }

  async expectActivityRelativeTimestampVisible() {
    await this.expectActivityEntriesVisible();
    await expect(
      this.activityFeed
        .getByText(/just now|seconds? ago|minutes? ago|hours? ago|days? ago/i)
        .first(),
    ).toBeVisible();
  }

  /**
   * Get an issue card by its title
   * Targets the overlay button which is the interactive element
   */
  getIssueCard(title: string) {
    // Match the accessible name (aria-label) which contains the title
    // e.g. "Open issue PROJ-123: Issue Title"
    // Escape regex characters to prevent matching errors
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.page.getByRole("button", { name: new RegExp(escaped) });
  }

  getIssueCardContainer(title: string) {
    return this.page
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .filter({ has: this.getIssueCard(title) })
      .first();
  }

  getIssueKeyElement(title: string) {
    return this.getIssueCardContainer(title).getByTestId(TEST_IDS.ISSUE.KEY);
  }

  async getIssueKey(title: string) {
    const issueKey = this.getIssueKeyElement(title);
    await expect(issueKey).toBeVisible();
    return (await issueKey.textContent())?.trim() ?? "";
  }

  getIssueDragHandle(title: string) {
    return this.getIssueCardContainer(title).getByTestId(TEST_IDS.ISSUE.DRAG_HANDLE);
  }

  getBoardColumn(name: string | RegExp) {
    const namePattern = typeof name === "string" ? new RegExp(`^${name}$`, "i") : name;
    return this.boardColumns.filter({ has: this.page.getByText(namePattern) }).first();
  }

  getBoardColumnCountBadgeByIndex(index: number) {
    return this.boardColumns.nth(index).getByTestId(TEST_IDS.BOARD.COLUMN_COUNT);
  }

  /**
   * Open an issue detail dialog by clicking its card
   */
  async openIssueDetail(title: string) {
    const issueCard = this.getIssueCard(title);
    await this.closeIssueDetailIfOpen();
    await issueCard.waitFor({ state: "visible" });

    await issueCard.click();
    await expect(this.issueDetailDialog).toBeVisible();

    // Wait for modal content to be stable using the issue key metadata,
    // which is consistently rendered regardless of sidebar section timing.
    await expect(this.issueDetailDialog.getByText(/[A-Z][A-Z0-9]+-\d+/).first()).toBeVisible();
  }

  async closeIssueDetail() {
    await this.closeIssueDetailIfOpen();
    await expect(this.issueDetailDialog).not.toBeVisible();
  }

  async closeIssueDetailIfOpen() {
    if (!(await this.issueDetailDialog.isVisible().catch(() => false))) {
      return;
    }

    await this.page.keyboard.press("Escape");

    if (await this.issueDetailDialog.isVisible().catch(() => false)) {
      await this.page.mouse.click(10, 10);
    }

    await expect(this.issueDetailDialog).not.toBeVisible();
  }

  async closeCreateProjectFormIfOpen() {
    if (!(await this.createProjectForm.isVisible().catch(() => false))) {
      return;
    }

    if (await this.cancelButton.isVisible().catch(() => false)) {
      await this.cancelButton.click().catch(() => {});
    }

    if (await this.createProjectForm.isVisible().catch(() => false)) {
      await this.page.keyboard.press("Escape");
    }

    if (await this.createProjectForm.isVisible().catch(() => false)) {
      await this.page.mouse.click(10, 10);
    }

    await expect(this.createProjectForm).not.toBeVisible();
  }

  async submitCreateProject() {
    if (!(await this.createProjectForm.isVisible().catch(() => false))) {
      return;
    }

    await this.tryStartCreateProjectSubmit();
    await this.expectCreateProjectSubmitStarted();
  }

  async tryStartCreateProjectSubmit() {
    if (!(await this.createProjectForm.isVisible().catch(() => false))) {
      return;
    }

    // Don't use bounded retry for non-idempotent project creation
    await expect(this.createButton).toBeVisible();
    await this.createButton.scrollIntoViewIfNeeded().catch(() => {});
    await this.createButton.click();
  }

  async waitForCreateProjectSubmitStart(timeout = 10000) {
    if (!(await this.createProjectForm.isVisible().catch(() => false))) {
      return true;
    }

    try {
      await expect
        .poll(() => this.getCreateProjectSubmitState(), {
          timeout,
          intervals: [200, 500, 1000],
        })
        .not.toBe("pending");
      return true;
    } catch {
      return false;
    }
  }

  async expectCreateProjectSubmitStarted(timeout = 10000) {
    const submitStarted = await this.waitForCreateProjectSubmitStart(timeout);
    expect(submitStarted).toBe(true);
  }

  private async getCreateProjectSubmitState(): Promise<"submitting" | "closed" | "pending"> {
    if (!(await this.createProjectForm.isVisible().catch(() => false))) {
      return "closed";
    }

    const creatingButton = this.createProjectForm.getByRole("button", { name: /creating/i });
    if (await creatingButton.isVisible().catch(() => false)) {
      return "submitting";
    }

    if (await this.createButton.isDisabled().catch(() => false)) {
      return "submitting";
    }

    return "pending";
  }

  async editIssueTitle(nextTitle: string) {
    await expect(this.issueDetailEditButton).toBeVisible();
    await this.issueDetailEditButton.click();

    await expect(this.issueDetailTitleInput).toBeVisible();
    await this.issueDetailTitleInput.fill(nextTitle);
    await expect(this.issueDetailTitleInput).toHaveValue(nextTitle);

    await this.issueDetailSaveChangesButton.click();

    await expect(this.issueDetailTitleInput).not.toBeVisible();
    await expect(this.issueDetailEditButton).toBeVisible();
    await waitForIssueUpdateSuccess(this.page);
  }

  async editIssueDescription(nextDescription: string) {
    await expect(this.issueDetailEditButton).toBeVisible();
    await this.issueDetailEditButton.click();

    await expect(this.issueDetailDescriptionEditor).toBeVisible();
    await this.issueDetailDescriptionEditor.fill(nextDescription);

    await this.issueDetailSaveChangesButton.click();

    await expect(this.issueDetailDescriptionEditor).not.toBeVisible();
    await expect(this.issueDetailEditButton).toBeVisible();
    await waitForIssueUpdateSuccess(this.page);
    await expect(this.issueDetailDescriptionContent).toContainText(nextDescription);
  }

  async changeIssuePriority(priorityLabel: "Highest" | "High" | "Medium" | "Low" | "Lowest") {
    await expect(this.issueDetailPrioritySelect).toBeVisible();
    await this.issueDetailPrioritySelect.click();

    const option = this.page.getByRole("option", { name: new RegExp(`^${priorityLabel}$`, "i") });
    await expect(option).toBeVisible();
    await option.click();

    await expect(this.issueDetailPrioritySelect).toContainText(new RegExp(priorityLabel, "i"));
    await waitForIssueUpdateSuccess(this.page);
  }

  /**
   * Start timer in issue detail dialog
   */
  async startTimer() {
    if (await this.stopTimerButton.isVisible().catch(() => false)) {
      return;
    }

    await this.completeTimerAction({
      actionButton: this.startTimerButton,
      completionButton: this.stopTimerButton,
      successToast: this.timerStartedToast,
    });
  }

  async stopTimer() {
    if (await this.startTimerButton.isVisible().catch(() => false)) {
      return;
    }

    await this.completeTimerAction({
      actionButton: this.stopTimerButton,
      completionButton: this.startTimerButton,
      successToast: this.timerStoppedToast,
    });
  }

  // ===================
  // Assertions
  // ===================

  async expectProjectsView(timeout = 10000) {
    await expect(this.sidebar).toBeVisible({ timeout });
    await expect.poll(async () => this.hasCreateProjectEntryPoint(), { timeout }).toBe(true);
  }

  async hasCreateProjectEntryPoint() {
    return await this.newProjectButton.isVisible().catch(() => false);
  }

  private async clickNewProjectButton() {
    await this.clickWithBoundedSecondAttempt(this.newProjectButton);
  }

  private async waitForProjectsView(timeout = 3000) {
    try {
      await this.expectProjectsView(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureProjectsView() {
    if (await this.waitForProjectsView(3000)) {
      return;
    }

    await this.navigateToProjectsRoute();
    await this.expectProjectsView();
  }

  private async navigateToProjectsRoute() {
    await this.gotoPath(ROUTES.projects.list.build(this.orgSlug), {
      waitUntil: "domcontentloaded",
    });
    await this.page.waitForLoadState("load");
    await this.waitForLoad();

    if (await this.waitForProjectsView(5000)) {
      return;
    }

    await this.gotoPath(ROUTES.app.build(), { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.gotoPath(ROUTES.projects.list.build(this.orgSlug), {
      waitUntil: "domcontentloaded",
    });
    await this.page.waitForLoadState("load");
    await this.waitForLoad();
  }

  private async getCreateProjectStep(): Promise<"template" | "configure" | "select" | "pending"> {
    const configureHeading = this.createProjectForm.getByRole("heading", {
      name: /configure project/i,
    });
    const selectHeading = this.page.getByRole("heading", {
      name: /choose a template/i,
    });

    if (await configureHeading.isVisible().catch(() => false)) {
      return "configure";
    }

    if (
      await this.templateOptionButtons
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return "template";
    }

    if (await selectHeading.isVisible().catch(() => false)) {
      return "select";
    }

    return "pending";
  }

  private async waitForCreateProjectStep(step: "template" | "configure", timeout = 3000) {
    try {
      await this.expectCreateProjectStep(step, timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async getCreateProjectWizardReadyState() {
    const step = await this.getCreateProjectStep();
    return step === "template" || step === "configure" ? step : null;
  }

  private async waitForCreateProjectWizardReady(timeout = 3000) {
    try {
      return await this.expectCreateProjectWizardReady(timeout);
    } catch {
      return null;
    }
  }

  private async expectCreateProjectWizardReady(timeout = 10000) {
    await this.createProjectForm.waitFor({ state: "visible", timeout });

    await expect
      .poll(async () => this.getCreateProjectWizardReadyState(), {
        timeout,
        intervals: [250, 500, 1000],
      })
      .not.toBeNull();

    const readyState = await this.getCreateProjectWizardReadyState();
    expect(readyState).not.toBeNull();
    return readyState;
  }

  private async expectCreateProjectStep(step: "template" | "configure", timeout = 10000) {
    await expect
      .poll(async () => this.getCreateProjectStep(), {
        timeout,
        intervals: [250, 500, 1000],
      })
      .toBe(step);
  }

  private async ensureCreateProjectConfigureStep() {
    if (await this.waitForCreateProjectStep("configure")) {
      return;
    }

    if (!(await this.waitForCreateProjectStep("template", 5000))) {
      await this.recoverCreateProjectTemplateStep();
    }

    // Recovery may land on either template or configure - only click template if needed
    if (await this.waitForCreateProjectStep("template", 1000)) {
      await this.clickFirstProjectTemplate();
    } else if (await this.waitForCreateProjectStep("configure", 1000)) {
      return;
    }

    if (await this.waitForCreateProjectStep("configure", 5000)) {
      return;
    }

    await this.recoverCreateProjectTemplateStep();
    // After recovery, check which step we landed on
    if (await this.waitForCreateProjectStep("template", 1000)) {
      await this.clickFirstProjectTemplate();
    }
    await this.expectCreateProjectStep("configure");
  }

  private async clickFirstProjectTemplate() {
    await this.clickWithBoundedSecondAttempt(this.templateOptionButtons.first());
  }

  private async clickWithBoundedSecondAttempt(locator: Locator, timeout = 3000) {
    await expect(locator).toBeVisible();
    await locator.scrollIntoViewIfNeeded().catch(() => {});

    try {
      await locator.click({ timeout });
      return;
    } catch {
      await expect(locator).toBeVisible();
      await expect(locator).toBeEnabled();
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.click({ timeout });
    }
  }

  private async recoverCreateProjectTemplateStep() {
    await this.goto();
    await this.expectProjectsView();
    await this.openCreateProjectForm();
    // Recovery can land on either template or configure - both are valid
    await expect
      .poll(
        async () => {
          const step = await this.getCreateProjectStep();
          return step === "template" || step === "configure";
        },
        { timeout: 10000, intervals: [250, 500, 1000] },
      )
      .toBe(true);
  }

  async expectBoardVisible() {
    await expect(this.projectBoard).toBeVisible();
  }

  async expectProjectNotFound() {
    await expect(this.page.getByRole("heading", { name: /project not found/i })).toBeVisible();
  }

  /** Wait for board to be fully interactive */
  async waitForBoardInteractive() {
    await waitForBoardLoaded(this.page);
  }

  async expectProjectCount(count: number) {
    await expect(this.projectItems).toHaveCount(count);
  }

  private async completeTimerAction({
    actionButton,
    completionButton,
    successToast,
  }: {
    actionButton: Locator;
    completionButton: Locator;
    successToast: Locator;
  }) {
    await expect(actionButton).toBeVisible();
    await expect(actionButton).toBeEnabled();
    await actionButton.scrollIntoViewIfNeeded();
    await actionButton.click();
    await expect(successToast).toBeVisible();
    await expect(completionButton).toBeVisible();
  }
}
