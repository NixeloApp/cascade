import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { BasePage } from "./base.page";

/**
 * Backlog Page Object
 * Handles the workspace backlog view with issue columns.
 */
export class BacklogPage extends BasePage {
  readonly boardColumn: Locator;
  readonly emptyState: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.boardColumn = page.getByTestId(TEST_IDS.BOARD.COLUMN);
    this.emptyState = page.getByText(/backlog is empty/i);
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
    await this.emptyState.or(this.boardColumn).waitFor({ state: "visible", timeout: 12000 });
  }
}
