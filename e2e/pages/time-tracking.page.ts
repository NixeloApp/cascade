import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * Time Tracking Page Object
 * Handles the time tracking view with entries and timer controls.
 */
export class TimeTrackingPage extends BasePage {
  readonly content: Locator;
  readonly entryForm: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.TIME_TRACKING.CONTENT);
    this.entryForm = page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM);
  }

  async goto() {
    await this.gotoPath(ROUTES.timeTracking.build(this.orgSlug));
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
