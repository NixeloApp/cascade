import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { isLocatorVisible } from "../utils/locator-state";
import { waitForScreenshotReady } from "../utils/wait-helpers";

export class PortalPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly portalTokenReceived: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /client portal|project view/i });
    this.portalTokenReceived = page.getByText(/portal token received/i);
    this.emptyStateMessage = page.getByText(/no projects are available for this portal token/i);
  }

  async waitForCaptureReady(state: "portal" | "portal-project"): Promise<void> {
    await this.heading.waitFor({ state: "visible", timeout: 12000 });

    if (state === "portal") {
      await expect
        .poll(
          async () =>
            (await isLocatorVisible(this.portalTokenReceived)) ||
            (await isLocatorVisible(this.emptyStateMessage)),
          {
            timeout: 12000,
            intervals: [200, 500, 1000],
          },
        )
        .toBe(true);
    }

    await waitForScreenshotReady(this.page);
  }
}
