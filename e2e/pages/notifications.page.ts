import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * Notifications Page Object
 * Handles the full-page notification center with filtering and pagination.
 */
export class NotificationsPage extends BasePage {
  readonly content: Locator;
  readonly markAllReadButton: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.NOTIFICATIONS.CONTENT);
    this.markAllReadButton = page.getByRole("button", { name: /mark all read/i });
  }

  async goto() {
    await this.gotoPath(ROUTES.notifications.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.content)) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }
}
