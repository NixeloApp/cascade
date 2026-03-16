import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import {
  createWorkspaceFromDialog,
  dismissWorkspaceDialogIfOpen,
  getWorkspaceDialogElements,
} from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Workspaces Page Object
 * Handles top-level department/workspace management
 */
export class WorkspacesPage extends BasePage {
  readonly newWorkspaceButton: Locator;
  readonly workspaceList: Locator;
  readonly workspaceCards: Locator;
  readonly workspaceTabs: Locator;
  readonly workspaceTeamsTab: Locator;
  readonly workspaceSettingsTab: Locator;
  readonly teamsPageHeader: Locator;
  readonly createTeamButton: Locator;
  readonly teamsEmptyStateHeading: Locator;
  readonly teamCards: Locator;
  readonly workspaceSettingsHeader: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // This page object targets the route-owned create-workspace modal, not the sidebar's
    // direct-create shortcut, so keep the trigger scoped to the page surface.
    this.newWorkspaceButton = page
      .getByRole("main")
      .getByRole("button", { name: /\+ Create Workspace|Create Workspace/i })
      .first();
    this.workspaceList = page.getByRole("main").locator("a[href*='/workspaces/']").locator("..");
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
    this.workspaceTabs = page
      .getByRole("navigation")
      .filter({ has: page.getByRole("link", { name: /^Teams$/ }) })
      .first();
    this.workspaceTeamsTab = this.workspaceTabs.getByRole("link", { name: /^Teams$/ });
    this.workspaceSettingsTab = this.workspaceTabs.getByRole("link", { name: /^Settings$/ });
    this.teamsPageHeader = page.getByRole("heading", { name: /^Teams$/ });
    this.createTeamButton = page.getByRole("button", { name: /create team/i }).first();
    this.teamsEmptyStateHeading = page.getByRole("heading", { name: /no teams yet/i });
    this.teamCards = page
      .getByRole("main")
      .locator("a[href*='/teams/']")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
    this.workspaceSettingsHeader = page.getByRole("heading", { name: /workspace settings/i });
  }

  async expectLoaded() {
    // Wait for any loading spinner to be hidden
    const loadingSpinner = this.page
      .locator(".loading-spinner")
      .or(this.page.getByText(/loading/i));
    await loadingSpinner.waitFor({ state: "hidden" }).catch(() => {});
  }

  async goto() {
    await this.navigateToWorkspacesRoute();
    await this.expectWorkspacesView();
  }

  async createWorkspace(name: string, description?: string) {
    const { createForm, dialog, descriptionInput, nameInput, submitButton } =
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
        await this.ensureWorkspacesView();
        await this.closeCreateWorkspaceDialogIfOpen(dialog);
        await this.clickNewWorkspaceButton();
      },
    });

    // After workspace creation, the page may redirect to the workspace detail page
    // Wait for either the workspace to appear in the list OR the workspace detail page to load
    await this.expectWorkspaceVisible(name);
  }

  async closeCreateWorkspaceDialogIfOpen(dialog = getWorkspaceDialogElements(this.page).dialog) {
    await dismissWorkspaceDialogIfOpen(this.page, dialog);
  }

  async expectWorkspacesView() {
    await expect(this.page.getByRole("heading", { name: /workspaces/i }).first()).toBeVisible();
    await expect(this.newWorkspaceButton.first()).toBeVisible();
  }

  async expectWorkspaceDetailVisible(name: string) {
    await expect(this.page).toHaveURL(
      new RegExp(ROUTES.workspaces.detail.path.replace(/\$\w+/g, "[^/]+")),
    );
    // PageHeader renders workspace name as h2
    await expect(this.page.getByRole("heading", { name, level: 2 })).toBeVisible();
  }

  async expectWorkspaceVisible(name: string) {
    const mainContent = this.page.getByRole("main");
    // Workspace list cards use h4, detail page uses h2 via PageHeader
    const workspaceCard = mainContent.locator(`a[href*="/workspaces/"]`).filter({ hasText: name });
    const workspaceH2 = mainContent.getByRole("heading", { name, level: 2 });
    const workspaceH4 = mainContent.getByRole("heading", { name, level: 4 });
    await expect(workspaceCard.or(workspaceH2).or(workspaceH4)).toBeVisible();
  }

  async isWorkspaceSettingsTabVisible() {
    return this.workspaceSettingsTab.isVisible().catch(() => false);
  }

  async openWorkspace(name: string) {
    // Only skip navigation if we're already on a workspace detail route with the heading visible
    const onWorkspaceRoute = /\/workspaces\/[^/]+(?:[/?#]|$)/.test(this.page.url());
    if (onWorkspaceRoute) {
      // PageHeader renders workspace name as h2
      const headingVisible = await this.page
        .getByRole("heading", { name, level: 2 })
        .isVisible()
        .catch(() => false);
      if (headingVisible) return;
    }

    const workspaceCard = this.page
      .getByRole("main")
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: name })
      .first();
    await expect(workspaceCard).toBeVisible();
    await workspaceCard.click();
  }

  async openWorkspaceTeams(name: string) {
    await this.openWorkspace(name);
    await expect(this.page).toHaveURL(
      new RegExp(ROUTES.workspaces.detail.path.replace(/\$\w+/g, "[^/]+")),
    );

    if (!/\/teams(?:[/?#]|$)/.test(this.page.url())) {
      await expect(this.workspaceTeamsTab).toBeVisible();
      await this.workspaceTeamsTab.click();
    }

    await this.expectTeamsLoaded();
  }

  async expectTeamsLoaded() {
    await expect(this.page).toHaveURL(
      new RegExp(ROUTES.workspaces.teams.list.path.replace(/\$\w+/g, "[^/]+")),
    );
    await expect(this.teamsPageHeader).toBeVisible();
    await expect(this.createTeamButton).toBeVisible();
  }

  async getTeamsPageState(): Promise<"empty" | "teams"> {
    await this.expectTeamsLoaded();

    if (
      await this.teamCards
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return "teams";
    }

    if (await this.teamsEmptyStateHeading.isVisible().catch(() => false)) {
      return "empty";
    }

    await expect(this.teamsEmptyStateHeading.or(this.teamCards.first())).toBeVisible();
    return (await this.teamCards
      .first()
      .isVisible()
      .catch(() => false))
      ? "teams"
      : "empty";
  }

  async expectWorkspaceSettingsLoaded() {
    await expect(this.page).toHaveURL(
      new RegExp(ROUTES.workspaces.settings.path.replace(/\$\w+/g, "[^/]+")),
    );
    await expect(this.workspaceSettingsHeader).toBeVisible();
  }

  async openWorkspaceSettings() {
    await expect(this.workspaceSettingsTab).toBeVisible();
    await this.workspaceSettingsTab.click();
    await this.expectWorkspaceSettingsLoaded();
  }

  async expectWorkspaceCount(count: number) {
    await expect(this.workspaceCards).toHaveCount(count);
  }

  private async waitForWorkspacesView(timeout = 3000) {
    try {
      await expect(this.page.getByRole("heading", { name: /workspaces/i }).first()).toBeVisible({
        timeout,
      });
      await expect(this.newWorkspaceButton.first()).toBeVisible({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  private async ensureWorkspacesView() {
    if (await this.waitForWorkspacesView(3000)) {
      return;
    }

    await this.navigateToWorkspacesRoute();
    await this.expectWorkspacesView();
  }

  private async navigateToWorkspacesRoute() {
    const workspacesUrl = ROUTES.workspaces.list.build(this.orgSlug);

    await this.gotoPath(workspacesUrl, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.expectLoaded();

    if (await this.waitForWorkspacesView(5000)) {
      return;
    }

    await this.gotoPath(ROUTES.app.build(), { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.gotoPath(workspacesUrl, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.expectLoaded();
  }

  private async clickNewWorkspaceButton() {
    const createButton = this.newWorkspaceButton.first();
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    await createButton.scrollIntoViewIfNeeded().catch(() => {});

    try {
      await createButton.click({ timeout: 3000 });
      return;
    } catch {
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
      await createButton.scrollIntoViewIfNeeded().catch(() => {});
      await createButton.click({ timeout: 3000 });
    }
  }
}
