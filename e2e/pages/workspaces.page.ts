import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES, routePattern } from "../utils/routes";
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
  readonly workspaceCards: Locator;
  readonly workspaceTabs: Locator;
  readonly workspaceTeamsTab: Locator;
  readonly workspaceSettingsTab: Locator;
  readonly createTeamButton: Locator;
  readonly teamsEmptyStateHeading: Locator;
  readonly workspaceSettingsHeader: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    this.newWorkspaceButton = page
      .getByRole("main")
      .getByRole("button", { name: /\+ Create Workspace|Create Workspace/i })
      .first();
    this.workspaceCards = page.getByTestId(TEST_IDS.WORKSPACE.CARD);
    this.workspaceTabs = page
      .getByRole("navigation")
      .filter({ has: page.getByRole("link", { name: /^Teams$/ }) })
      .first();
    this.workspaceTeamsTab = this.workspaceTabs.getByRole("link", { name: /^Teams$/ });
    this.workspaceSettingsTab = this.workspaceTabs.getByRole("link", { name: /^Settings$/ });
    this.createTeamButton = page.getByRole("button", { name: /create team/i }).first();
    this.teamsEmptyStateHeading = page.getByRole("heading", { name: /no teams yet/i });
    this.workspaceSettingsHeader = page.getByRole("heading", { name: /workspace settings/i });
  }

  async expectLoaded() {
    await this.page
      .getByTestId(TEST_IDS.LOADING.SPINNER)
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {
        /* spinner may not appear at all */
      });
  }

  async goto() {
    await this.navigateToWorkspacesRoute();
    await this.expectWorkspacesView();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          const cardCount = await getLocatorCount(this.workspaceCards);
          if (cardCount > 0) return "ready";
          return (await isLocatorVisible(this.page.getByText(/no workspaces yet/i)))
            ? "ready"
            : "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
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

    await this.expectWorkspaceVisible(name);
  }

  async closeCreateWorkspaceDialogIfOpen(dialog = getWorkspaceDialogElements(this.page).dialog) {
    await dismissWorkspaceDialogIfOpen(this.page, dialog);
  }

  async expectWorkspacesView() {
    await expect(this.pageHeaderTitle).toBeVisible();
    await expect(this.newWorkspaceButton.first()).toBeVisible();
  }

  async expectWorkspaceDetailVisible(name: string) {
    await expect(this.page).toHaveURL(routePattern(ROUTES.workspaces.detail.path));
    await expect(this.pageHeaderTitle).toBeVisible();
    await expect(this.pageHeaderTitle).toContainText(name);
  }

  async expectWorkspaceVisible(name: string) {
    const card = this.workspaceCards.filter({ hasText: name }).first();
    const heading = this.pageHeaderTitle;
    await expect(card.or(heading)).toBeVisible();
  }

  async isWorkspaceSettingsTabVisible() {
    return isLocatorVisible(this.workspaceSettingsTab);
  }

  async openWorkspace(name: string) {
    const onWorkspaceRoute = routePattern(ROUTES.workspaces.detail.path).test(this.page.url());
    if (onWorkspaceRoute) {
      const headingVisible = await isLocatorVisible(this.pageHeaderTitle);
      if (headingVisible) {
        const text = await this.pageHeaderTitle.textContent();
        if (text?.includes(name)) return;
      }
    }

    const card = this.workspaceCards.filter({ hasText: name }).first();
    await expect(card).toBeVisible();
    await card.click();
  }

  async openWorkspaceTeams(name: string) {
    await this.openWorkspace(name);
    await expect(this.page).toHaveURL(routePattern(ROUTES.workspaces.detail.path));

    if (!/\/teams(?:[/?#]|$)/.test(this.page.url())) {
      await expect(this.workspaceTeamsTab).toBeVisible();
      await this.workspaceTeamsTab.click();
    }

    await this.expectTeamsLoaded();
  }

  async expectTeamsLoaded() {
    await expect(this.page).toHaveURL(routePattern(ROUTES.workspaces.teams.list.path));
    await expect(this.createTeamButton).toBeVisible();
  }

  async getTeamsPageState(): Promise<"empty" | "teams"> {
    await this.expectTeamsLoaded();

    const teamCards = this.page.getByTestId(TEST_IDS.WORKSPACE.CARD);
    if (await isLocatorVisible(teamCards.first())) {
      return "teams";
    }

    if (await isLocatorVisible(this.teamsEmptyStateHeading)) {
      return "empty";
    }

    await expect(this.teamsEmptyStateHeading.or(teamCards.first())).toBeVisible();
    return (await isLocatorVisible(teamCards.first())) ? "teams" : "empty";
  }

  async expectWorkspaceSettingsLoaded() {
    await expect(this.page).toHaveURL(routePattern(ROUTES.workspaces.settings.path));
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
      await expect(this.pageHeaderTitle).toBeVisible({ timeout });
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
    await this.prepareLocatorForInteraction(createButton, "create workspace button");
    await expect(createButton).toBeEnabled();

    try {
      await createButton.click({ timeout: 3000 });
      return;
    } catch {
      await this.prepareLocatorForInteraction(createButton, "create workspace button retry");
      await expect(createButton).toBeEnabled();
      await createButton.click({ timeout: 3000 });
    }
  }

  private async prepareLocatorForInteraction(locator: Locator, label: string): Promise<void> {
    await expect(locator, `${label} should be visible before interaction`).toBeVisible();

    try {
      await locator.scrollIntoViewIfNeeded();
    } catch (error) {
      try {
        await expect(
          locator,
          `${label} should remain visible after a transient re-render`,
        ).toBeVisible();
        return;
      } catch {
        // Fall through
      }

      const stillVisible = await isLocatorVisible(locator);
      if (stillVisible) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label} was not visible after scroll attempt: ${message}`);
    }
  }
}
