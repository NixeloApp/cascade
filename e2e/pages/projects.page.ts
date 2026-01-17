import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
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
  readonly createEntityButton: Locator; // Alias for sidebar "Add new project" or "Create Workspace" button
  readonly projectList: Locator;
  readonly projectItems: Locator;

  // ===================
  // Locators - Create Project Form
  // ===================
  readonly createProjectForm: Locator;
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
  readonly submitIssueButton: Locator;

  // ===================
  // Locators - Project Tabs
  // ===================
  readonly boardTab: Locator;
  readonly backlogTab: Locator;
  readonly sprintsTab: Locator;
  readonly analyticsTab: Locator;
  readonly settingsTab: Locator;

  // ===================
  // Locators - Issue Detail Dialog
  // ===================
  readonly issueDetailDialog: Locator;
  readonly startTimerButton: Locator;
  readonly stopTimerButton: Locator;
  readonly timerStoppedToast: Locator;

  // Workspace creation
  readonly workspaceNameInput: Locator;
  readonly workspaceDescriptionInput: Locator;
  readonly submitWorkspaceButton: Locator;

  constructor(page: Page, _orgSlug = "nixelo-e2e") {
    super(page);

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.locator("aside").first());
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
    // We'll pick the first template by default or look for specific one
    // const templateButton = this.createProjectForm.getByRole("button").filter({ hasText: "Software Project" });

    this.projectNameInput = page.getByLabel(/project name/i);
    this.projectKeyInput = page.getByLabel(/project key/i);
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
    this.boardColumns = page.locator("[data-board-column]").or(page.locator(".kanban-column"));
    this.issueCards = page.locator("[data-issue-card]").or(page.locator(".issue-card"));
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
    this.submitIssueButton = this.createIssueModal.getByRole("button", { name: /create|submit/i });

    // Project tabs - rendered as buttons in ProjectBoard.tsx with "X view" aria-labels
    this.boardTab = page.getByRole("button", { name: "Board view" });
    this.backlogTab = page.getByRole("button", { name: "Backlog view" });
    this.sprintsTab = page.getByRole("button", { name: "Sprints view" });
    this.analyticsTab = page.getByRole("button", { name: "Analytics view" });
    this.settingsTab = page.getByRole("button", { name: "Settings view" });
    // Issue detail dialog
    // Issue detail dialog - distinct from Create Issue modal
    this.issueDetailDialog = page.getByTestId("issue-detail-modal");
    this.startTimerButton = this.issueDetailDialog.getByRole("button", { name: "Start Timer" });
    this.stopTimerButton = this.issueDetailDialog.getByRole("button", { name: /stop timer|stop/i });
    this.timerStoppedToast = page.getByText(/Timer stopped/i);

    // Workspace creation
    this.workspaceNameInput = page.getByLabel(/workspace name/i);
    this.workspaceDescriptionInput = page.getByLabel(/description/i);
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
  }

  /**
   * Get the project settings link specifically from the project navigation (top bar)
   * Scoped to "main" to avoid confusing it with global settings or sidebar items
   */
  getProjectSettingsTab() {
    // Robust selector: match either the navigation link (sidebar/topbar) or the tab  getProjectSettingsTab() {
    return this.page
      .getByRole("navigation", { name: "Tabs" })
      .getByRole("link", { name: "Settings" });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    // Navigate directly to the legacy projects route to ensure we hit ProjectsList
    // which has the "Create Project" button wired up correctly.
    // Assumes we are already logged in and on a page with organization slug in URL.
    // Fallback to nixelo-e2e if not found (dashboard test default).
    const slug = this.getOrganizationSlug();
    if (!slug) throw new Error("Organization slug not found in URL");
    await this.page.goto(`/${slug}/projects`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async openCreateProjectForm() {
    // Wait for React to hydrate before clicking
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);

    console.log("Clicking 'Create Project' button...");

    // Robust open: Retry clicking if modal doesn't appear (handles hydration misses)
    await expect(async () => {
      if (!(await this.createProjectForm.isVisible())) {
        await this.newProjectButton.click();
      }
      await expect(this.createProjectForm).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 15000 });

    console.log("Create project modal visible.");
  }

  async createProject(name: string, key: string, description?: string) {
    await this.openCreateProjectForm();

    try {
      // Step 0: Wait for loading spinner to NOT be visible (templates loading)
      const spinner = this.createProjectForm.locator(".animate-spin");
      if (await spinner.isVisible()) {
        await expect(spinner).not.toBeVisible({ timeout: 30000 });
      }

      // Step 1: Wait for templates to load and select Software Project
      // Step 1: Wait for templates to load and select Software Development
      const softwareText = this.createProjectForm.getByRole("heading", {
        name: /Software Development/i,
      });

      await softwareText.waitFor({ state: "visible", timeout: 30000 });
      // Playwright's click() will auto-scroll. Explicit scroll can be brittle in some layouts.

      // Retry click if step transition doesn't happen
      await expect(async () => {
        // Recovery: If modal closed (flakiness), re-open it
        if (!(await this.createProjectForm.isVisible())) {
          await this.newProjectButton.click();
          await expect(this.createProjectForm).toBeVisible();
        }

        // Wait for spinner to be gone again
        const innerSpinner = this.createProjectForm.locator(".animate-spin");
        if (await innerSpinner.isVisible()) {
          await expect(innerSpinner).not.toBeVisible({ timeout: 5000 });
        }

        // Click the template
        const template = this.createProjectForm.getByRole("heading", {
          name: /Software Development/i,
        });
        await template.waitFor({ state: "visible", timeout: 5000 });
        await template.click({ force: true });

        // Verify we proceeded to configuration step
        await expect(this.createProjectForm.getByText("Configure Project")).toBeVisible({
          timeout: 5000,
        });
      }).toPass({ timeout: 20000 });

      // Step 2: Fill in project details
      await this.projectNameInput.waitFor({ state: "visible", timeout: 5000 });
      await this.projectNameInput.fill(name);
      await expect(this.projectNameInput).toHaveValue(name);

      await this.projectKeyInput.waitFor({ state: "visible", timeout: 5000 });
      await this.projectKeyInput.fill(key);
      await expect(this.projectKeyInput).toHaveValue(key.toUpperCase());

      if (description) {
        await this.projectDescriptionInput.fill(description);
      }

      // Create project
      await this.createButton.waitFor({ state: "visible", timeout: 15000 });
      await expect(this.createButton).toBeEnabled({ timeout: 5000 });
      await this.createButton.click();

      // Wait for success toast - this confirms the backend operation finished
      // This is more robust than just waiting for the modal to close, as it handles slow backend responses better
      try {
        await expect(this.page.getByText("Project created successfully")).toBeVisible({
          timeout: 20000,
        });
      } catch (e) {
        // If success toast didn't appear, check if we have an error toast to report better failure
        const errorToast = this.page.locator('[data-sonner-toast][data-type="error"]');
        if (await errorToast.isVisible()) {
          const errorText = await errorToast.textContent();
          console.error("Project Creation Failed with Toast:", errorText);
          throw new Error(`Project Creation Failed: ${errorText}`);
        }
        throw e;
      }

      // Wait for navigation to the new project page
      // This is more robust than waiting for modal close, which can race with navigation
      await this.page.waitForURL(/\/projects\/[A-Z0-9-]+/, { timeout: 30000 });

      // Wait for the new page to stabilize
      await this.page.waitForLoadState("networkidle");
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
    await this.page.waitForURL(/\/workspaces/);

    await this.page.getByRole("button", { name: "+ Create Workspace" }).click();

    await this.workspaceNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.workspaceNameInput.fill(name);
    if (description) {
      await this.workspaceDescriptionInput.fill(description);
    }
    await this.submitWorkspaceButton.click();

    // Verify success
    await expect(this.page.getByText("Workspace created successfully")).toBeVisible({
      timeout: 10000,
    });
    // Verify modal closed
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async cancelCreateProject() {
    await this.cancelButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.createProjectForm).not.toBeVisible();
  }

  async selectProject(index: number) {
    const item = this.projectItems.nth(index);
    await item.evaluate((el: HTMLElement) => el.click());
  }

  async openCreateIssueModal() {
    await this.createIssueButton.click();
    await expect(this.createIssueModal).toBeVisible({ timeout: 5000 });
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
    await this.submitIssueButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToTab(tab: "board" | "backlog" | "sprints" | "analytics" | "settings") {
    const tabs = {
      board: this.boardTab,
      backlog: this.backlogTab,
      sprints: this.sprintsTab,
      analytics: this.analyticsTab,
      settings: this.settingsTab,
    };

    const tabLocator = tabs[tab];
    await expect(tabLocator).toBeVisible({ timeout: 5000 });
    // Use force click to ensure we hit it even if animations are playing
    await tabLocator.click({ force: true });
  }

  /**
   * Get an issue card by its title
   */
  getIssueCard(title: string) {
    return this.page.getByRole("heading", { name: title, level: 4 });
  }

  /**
   * Open an issue detail dialog by clicking its card
   */
  async openIssueDetail(title: string) {
    const issueCard = this.getIssueCard(title);
    await issueCard.waitFor({ state: "visible", timeout: 5000 });
    await issueCard.click();
    await expect(this.issueDetailDialog).toBeVisible({ timeout: 5000 });

    // Wait for the issue content to load (skeleton to disappear / critical sections to appear)
    const timeTrackingHeader = this.issueDetailDialog
      .getByRole("heading", {
        name: /time tracking/i,
      })
      .first();
    await expect(timeTrackingHeader).toBeVisible({ timeout: 10000 });
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
        await this.startTimerButton.click({ timeout: 2000 });
      } catch (e) {
        console.log("Standard click failed/timed out, trying force click...");
        await this.startTimerButton.click({ force: true });
      }

      // If still not working, the test will retry this block via toPass
      // No need to dispatchEvent yet, force click usually covers it.
      // But we will wait for the UI update longer inside the expectation
      await expect(this.stopTimerButton).toBeVisible({ timeout: 5000 });
    }).toPass({ intervals: [1000], timeout: 15000 });
  }

  async stopTimer() {
    await expect(async () => {
      if (await this.startTimerButton.isVisible()) {
        return;
      }

      await expect(this.stopTimerButton).toBeVisible({ timeout: 5000 });
      await expect(this.stopTimerButton).toBeEnabled();
      await this.stopTimerButton.click();

      await expect(this.startTimerButton).toBeVisible({ timeout: 2000 });
    }).toPass({ intervals: [1000], timeout: 15000 });
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

  async expectProjectCount(count: number) {
    await expect(this.projectItems).toHaveCount(count);
  }
}
