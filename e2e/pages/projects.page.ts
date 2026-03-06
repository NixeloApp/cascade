import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import {
  createWorkspaceFromDialog,
  getWorkspaceDialogElements,
  waitForBoardLoaded,
  waitForIssueCreateSuccess,
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
  readonly sprintsTab: Locator;
  readonly activityTab: Locator;
  readonly analyticsTab: Locator;
  readonly settingsTab: Locator;

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

  // ===================
  // Locators - Issue Detail Dialog
  // ===================
  readonly issueDetailDialog: Locator;
  readonly issueDetailEditButton: Locator;
  readonly issueDetailTitleInput: Locator;
  readonly issueDetailSaveChangesButton: Locator;
  readonly startTimerButton: Locator;
  readonly stopTimerButton: Locator;
  readonly timerStoppedToast: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.getByRole("complementary"));
    // Updated to distinguish between Project and Workspace
    this.newProjectButton = page.getByRole("button", { name: "+ Create Project" });
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
    this.createProjectForm = page.getByRole("dialog");

    // Template selection
    // Select from stable modal content instead of hardcoding template display names
    this.templateOptionButtons = page
      .getByTestId(TEST_IDS.PROJECT.CREATE_MODAL)
      .locator("li")
      .getByRole("button");

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
    // Create issue - look for "Add issue" button (column headers have "Add issue to X")
    this.createIssueButton = page.getByRole("button", { name: /add issue/i }).first();

    // Create issue modal
    this.createIssueModal = page
      .getByRole("dialog")
      .filter({ hasText: /create.*issue|new.*issue/i });
    this.issueTitleInput = page.getByPlaceholder(/title|issue.*title/i);
    this.issueDescriptionInput = page
      .getByPlaceholder(/description/i)
      .or(page.locator("[data-issue-description]"));
    this.issueTypeSelect = page.getByRole("combobox", { name: /type/i });
    this.issuePrioritySelect = page.getByRole("combobox", { name: /priority/i });
    this.issueAssigneeSelect = page.getByRole("combobox", { name: /assignee/i });
    this.createIssueForm = this.createIssueModal.locator("form").first();
    this.submitIssueButton = this.createIssueModal
      .getByRole("button", { name: /^create issue$/i })
      .or(this.createIssueModal.locator('button[type="submit"]'));

    // Project tabs - scope to the project tab strip to avoid collisions with global nav links.
    this.projectTabs = page.getByRole("navigation", { name: "Tabs" }).or(page.getByLabel("Tabs"));
    this.boardTab = this.projectTabs.getByRole("link", { name: /^Board$/ });
    this.backlogTab = this.projectTabs.getByRole("link", { name: /^Backlog$/ });
    this.sprintsTab = this.projectTabs.getByRole("link", { name: /^Sprints$/ });
    this.activityTab = this.projectTabs.getByRole("link", { name: /^Activity$/ });
    this.analyticsTab = this.projectTabs.getByRole("link", { name: /^Analytics$/ });
    this.settingsTab = this.projectTabs.getByRole("link", { name: /^Settings$/ });

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
    // Issue detail dialog
    // Issue detail dialog - distinct from Create Issue modal
    this.issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    this.issueDetailEditButton = this.issueDetailDialog.getByRole("button", { name: /^Edit$/ });
    this.issueDetailTitleInput = this.issueDetailDialog.getByPlaceholder("Issue title");
    this.issueDetailSaveChangesButton = this.issueDetailDialog.getByRole("button", {
      name: /save changes/i,
    });
    this.startTimerButton = this.issueDetailDialog.getByRole("button", { name: "Start Timer" });
    this.stopTimerButton = this.issueDetailDialog.getByRole("button", { name: /stop timer|stop/i });
    this.timerStoppedToast = page.getByText(/Timer stopped/i);
  }

  /**
   * Get the project settings link specifically from the project navigation (top bar)
   * Scoped to "main" to avoid confusing it with global settings or sidebar items
   */
  getProjectSettingsTab() {
    return this.projectTabs.getByRole("link", { name: "Settings" });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    // Navigate directly to the projects route
    await this.page.goto(`/${this.orgSlug}/projects`);
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async openCreateProjectForm() {
    console.log("Clicking 'Create Project' button...");

    // Robust open: Retry clicking if modal doesn't appear (handles hydration timing)
    await expect(async () => {
      if (!(await this.createProjectForm.isVisible())) {
        await this.newProjectButton.click();
      }
      await expect(this.createProjectForm).toBeVisible();
    }).toPass();

    console.log("Create project modal visible.");
  }

  async createProject(name: string, key: string, description?: string) {
    await this.openCreateProjectForm();

    try {
      // Use retry pattern to handle modal reopen/hydration/template loading races.
      await expect(async () => {
        // Recovery: If modal closed (flakiness), re-open it
        if (!(await this.createProjectForm.isVisible())) {
          await this.newProjectButton.click();
          await expect(this.createProjectForm).toBeVisible();
        }

        const configureHeading = this.createProjectForm.getByRole("heading", {
          name: /configure project/i,
        });
        if (await configureHeading.isVisible()) {
          return;
        }

        // Wait for at least one template card and select the first available option.
        // Template names are content-managed and should not be hardcoded in E2E selectors.
        await expect(this.templateOptionButtons.first()).toBeVisible();
        await this.templateOptionButtons.first().click();

        // Verify we proceeded to configuration step
        await expect(configureHeading).toBeVisible();
      }).toPass();

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

      // Create project and tolerate occasional missed clicks or slower route transitions.
      await expect(async () => {
        if (/\/projects\/[A-Z0-9-]+\/board/.test(this.page.url())) {
          return;
        }

        await this.createButton.waitFor({ state: "visible" });
        await expect(this.createButton).toBeEnabled();

        try {
          await this.createButton.click();
        } catch {
          await this.createButton.dispatchEvent("click");
        }

        // The app redirects to /projects/[KEY]/board after creation.
        await this.page.waitForURL(/\/projects\/[A-Z0-9-]+\/board/, { timeout: 5000 });
      }).toPass({ timeout: 30000, intervals: [1000] });

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
        await this.newWorkspaceButton.click();
      },
    });

    // Deterministic completion: modal closes and workspace route remains active.
    await expect(this.page).toHaveURL(/\/workspaces(\/[^/?#]+)?(?:[/?#]|$)/);
  }

  async cancelCreateProject() {
    await this.cancelButton.click();
    await expect(this.createProjectForm).not.toBeVisible();
  }

  async selectProject(index: number) {
    const item = this.projectItems.nth(index);
    await item.click();
  }

  async openCreateIssueModal() {
    await this.createIssueButton.click();
    await expect(this.createIssueModal).toBeVisible();
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
    await expect(async () => {
      if (!(await this.createIssueModal.isVisible())) {
        return;
      }

      // Submit the form directly to avoid viewport/actionability flakiness on modal footer buttons.
      if (await this.createIssueForm.isVisible()) {
        await this.createIssueForm.evaluate((form: HTMLFormElement) => form.requestSubmit());
      } else {
        await this.submitIssueButton.dispatchEvent("click");
      }
      await expect(this.createIssueModal).not.toBeVisible();
    }).toPass();

    await waitForIssueCreateSuccess(this.page);
  }

  async switchToTab(tab: "board" | "backlog" | "sprints" | "activity" | "analytics" | "settings") {
    const tabs = {
      board: this.boardTab,
      backlog: this.backlogTab,
      sprints: this.sprintsTab,
      activity: this.activityTab,
      analytics: this.analyticsTab,
      settings: this.settingsTab,
    };

    const tabLocator = tabs[tab];

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

    if (tab === "analytics") {
      await expect(this.analyticsPageHeader).toBeVisible();
      await expect(this.analyticsTotalIssuesMetric).toBeVisible();
    }
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
    await issueCard.waitFor({ state: "visible" });
    await issueCard.click();
    await expect(this.issueDetailDialog).toBeVisible();

    // Wait for modal content to be stable using the issue key metadata,
    // which is consistently rendered regardless of sidebar section timing.
    await expect(this.issueDetailDialog.getByText(/[A-Z][A-Z0-9]+-\d+/).first()).toBeVisible();
  }

  async editIssueTitle(nextTitle: string) {
    await expect(this.issueDetailEditButton).toBeVisible();
    await this.issueDetailEditButton.click();

    await expect(this.issueDetailTitleInput).toBeVisible();
    await this.issueDetailTitleInput.fill(nextTitle);
    await expect(this.issueDetailTitleInput).toHaveValue(nextTitle);

    await this.issueDetailSaveChangesButton.click();

    await expect(this.issueDetailTitleInput).not.toBeVisible();
    await expect(this.issueDetailDialog.getByRole("heading", { name: nextTitle })).toBeVisible();
  }

  /**
   * Start timer in issue detail dialog
   */
  async startTimer() {
    await expect(async () => {
      if (await this.stopTimerButton.isVisible()) {
        return;
      }

      // Robust interaction: Scroll into view, hover, then click
      await this.startTimerButton.scrollIntoViewIfNeeded();
      await this.startTimerButton.hover();

      try {
        // Try standard click first (most realistic)
        await this.startTimerButton.click();
      } catch (_e) {
        console.log("Standard click failed/timed out, trying force click...");
        await this.startTimerButton.click();
      }

      // If still not working, the test will retry this block via toPass
      // No need to dispatchEvent yet, force click usually covers it.
      // But we will wait for the UI update longer inside the expectation
      await expect(this.stopTimerButton).toBeVisible();
    }).toPass({ intervals: [1000] });
  }

  async stopTimer() {
    await expect(async () => {
      if (await this.startTimerButton.isVisible()) {
        return;
      }

      await expect(this.stopTimerButton).toBeVisible();
      await expect(this.stopTimerButton).toBeEnabled();
      await this.stopTimerButton.click();

      await expect(this.startTimerButton).toBeVisible();
    }).toPass({ intervals: [1000] });
  }

  // ===================
  // Assertions
  // ===================

  async expectProjectsView() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.newProjectButton).toBeVisible();
  }

  async expectBoardVisible() {
    await expect(this.projectBoard).toBeVisible();
  }

  /** Wait for board to be fully interactive */
  async waitForBoardInteractive() {
    await waitForBoardLoaded(this.page);
  }

  async expectProjectCount(count: number) {
    await expect(this.projectItems).toHaveCount(count);
  }
}
