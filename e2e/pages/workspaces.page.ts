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

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Scope to main content to avoid sidebar's "Add new workspace" button
    this.newWorkspaceButton = page.getByRole("button", {
      name: /\+ Create Workspace|Create Workspace/i,
    });
    this.workspaceNameInput = page.locator("#workspace-name");
    this.workspaceDescriptionInput = page.locator("#workspace-description");
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
    this.workspaceList = page.getByRole("main").locator("a[href*='/workspaces/']").locator("..");
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
  }

  async expectLoaded() {
    // Wait for any loading spinner to be hidden
    const loadingSpinner = this.page
      .locator(".loading-spinner")
      .or(this.page.getByText(/loading/i));
    await loadingSpinner.waitFor({ state: "hidden" }).catch(() => {});
  }

  async goto() {
    const workspacesUrl = `/${this.orgSlug}/workspaces`;

    await this.page.goto(workspacesUrl, { waitUntil: "domcontentloaded" });

    try {
      // Wait for the Workspaces heading
      await this.page
        .getByRole("heading", { name: /workspaces/i })
        .first()
        .waitFor({ state: "visible" });
    } catch (e) {
      const currentUrl = this.page.url();
      const bodyText = await this.page
        .evaluate(() => document.body.innerText)
        .catch(() => "Could not get body text");
      console.log(`[DEBUG] WorkspacesPage.goto failed`);
      console.log(`[DEBUG] Target URL: ${workspacesUrl}`);
      console.log(`[DEBUG] Current URL: ${currentUrl}`);
      const localStorage = await this.page
        .evaluate(() => JSON.stringify(localStorage))
        .catch(() => "Could not get localStorage");
      const convexClientState = await this.page
        .evaluate(() => {
          // biome-ignore lint/suspicious/noExplicitAny: Accessing internal test client
          const client = (window as any).__convex_test_client;
          return client
            ? `Found client. Auth token set: ${!!client.authenticationToken}`
            : "Client not found on window";
        })
        .catch(() => "Error getting client state");
      console.log(`[DEBUG] LocalStorage: ${localStorage}`);
      console.log(`[DEBUG] ConvexClient: ${convexClientState}`);
      console.log(`[DEBUG] Body Text: ${bodyText.substring(0, 1000)}`);
      throw e;
    }
  }

  async createWorkspace(name: string, description?: string) {
    // Wait for page to be stable first
    await this.page.waitForLoadState("domcontentloaded");

    // Wait for button to be ready - use first() to get the header button (not empty state)
    const createButton = this.newWorkspaceButton.first();
    await createButton.waitFor({ state: "visible" });

    // Click and retry until modal opens
    await expect(async () => {
      // Press Escape first to clear any existing modal state
      await this.page.keyboard.press("Escape");
      await createButton.scrollIntoViewIfNeeded();
      await createButton.click();
      // Wait for modal dialog to appear
      const modal = this.page.getByRole("dialog");
      await expect(modal).toBeVisible();
    }).toPass();

    // Fill and submit with retry - handles form timing issues
    await expect(async () => {
      // Ensure input is ready
      await expect(this.workspaceNameInput).toBeVisible();
      await expect(this.workspaceNameInput).toBeEnabled();

      // Fill with name
      await this.workspaceNameInput.fill(name);

      // Verify the value was filled correctly
      await expect(this.workspaceNameInput).toHaveValue(name);

      if (description) {
        await expect(this.workspaceDescriptionInput).toBeVisible();
        await expect(this.workspaceDescriptionInput).toBeEnabled();
        await this.workspaceDescriptionInput.fill(description);
      }

      // Submit
      await this.submitWorkspaceButton.click();

      // Wait for success toast
      await expect(
        this.page
          .getByText(/workspace created/i)
          .or(this.page.locator("[data-sonner-toast]"))
          .first(),
      ).toBeVisible();
    }).toPass();

    // Wait for modal to close (name input disappears)
    await expect(this.workspaceNameInput).not.toBeVisible();

    // After workspace creation, the page may redirect to the workspace detail page
    // Wait for either the workspace to appear in the list OR the workspace detail page to load
    const mainContent = this.page.getByRole("main");
    const newWorkspaceCard = mainContent
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: name });
    const workspaceHeading = mainContent.getByRole("heading", { name, level: 3 });
    await expect(newWorkspaceCard.or(workspaceHeading)).toBeVisible();
  }

  async expectWorkspacesView() {
    await expect(this.newWorkspaceButton).toBeVisible();
  }

  async expectWorkspaceCount(count: number) {
    await expect(this.workspaceCards).toHaveCount(count);
  }
}
