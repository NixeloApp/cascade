import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Backlog Page Object
 * Handles the workspace backlog view with filterable issue rows.
 */
export class BacklogPage extends BasePage {
  readonly emptyState: Locator;
  readonly issueSummary: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.emptyState = page.getByText(/backlog is empty/i);
    this.issueSummary = page.getByText(/^\d+\s+issues?(?:\s+\([^)]+\))?$/i);
  }

  async goto() {
    // Backlog is per-workspace; caller should navigate via workspace route.
    throw new Error("BacklogPage.goto() requires a workspace slug — use gotoWorkspace() instead");
  }

  async gotoWorkspace(workspaceSlug: string) {
    const { ROUTES } = await import("../utils/routes");
    await this.gotoPath(ROUTES.workspaces.backlog.build(this.orgSlug, workspaceSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.emptyState.or(this.issueSummary).waitFor({ state: "visible", timeout: 12000 });
  }
}
