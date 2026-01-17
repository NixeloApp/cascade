import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Workspaces Page Object
 * Handles top-level department/workspace management
 */
export class WorkspacesPage extends BasePage {
  readonly newWorkspaceButton: Locator;
  readonly workspaceNameInput: Locator;
  readonly workspaceDescriptionInput: Locator;
  readonly submitWorkspaceButton: Locator;
  readonly workspaceList: Locator;
  readonly workspaceCards: Locator;

  constructor(page: Page) {
    super(page);

    // Scope to main content to avoid sidebar's "Add new workspace" button
    this.newWorkspaceButton = page.locator("main").getByRole("button", {
      name: /\+ Create Workspace|Create Workspace/i,
    });
    this.workspaceNameInput = page.getByLabel(/workspace name/i);
    this.workspaceDescriptionInput = page.getByLabel(/description/i);
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
    this.workspaceList = page.locator(".grid"); // Adjust based on actual container
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
  }

  async expectLoaded() {
    // Wait for the global loading spinner or "Loading..." text to disappear
    const loadingSpinner = this.page
      .locator(".loading-spinner")
      .or(this.page.getByText(/loading/i));
    // Wait for it to become hidden OR detached
    await loadingSpinner.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await loadingSpinner.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500); // Small stabilization
  }

  async goto() {
    // Use hardcoded slug for E2E tests since getOrganizationSlug() fails on fresh pages
    const workspacesUrl = `/nixelo-e2e/workspaces`;

    await this.page.goto(workspacesUrl, { waitUntil: "domcontentloaded" });
    await this.expectLoaded();
    await this.waitForLoad();
  }

  async createWorkspace(name: string, description?: string) {
    await this.newWorkspaceButton.click();
    await this.workspaceNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.workspaceNameInput.fill(name);
    if (description) {
      await this.workspaceDescriptionInput.fill(description);
    }
    await this.submitWorkspaceButton.click();
    // Wait for navigation or modal close
    await expect(this.workspaceNameInput).not.toBeVisible({ timeout: 10000 });
  }

  async expectWorkspacesView() {
    await expect(this.newWorkspaceButton).toBeVisible();
  }

  async expectWorkspaceCount(count: number) {
    await expect(this.workspaceCards).toHaveCount(count);
  }
}
