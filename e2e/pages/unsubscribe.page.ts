import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { waitForScreenshotReady } from "../utils/wait-helpers";

export class UnsubscribePage {
  readonly page: Page;
  readonly unsubscribedHeading: Locator;
  readonly invalidHeading: Locator;
  readonly errorHeading: Locator;
  readonly successMessage: Locator;
  readonly invalidMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.unsubscribedHeading = page.getByRole("heading", { name: /unsubscribed/i });
    this.invalidHeading = page.getByRole("heading", { name: /invalid link/i });
    this.errorHeading = page.getByRole("heading", { name: /something went wrong/i });
    this.successMessage = page.getByText(/you've been unsubscribed from email notifications/i);
    this.invalidMessage = page.getByText(/this unsubscribe link is invalid or has expired/i);
    this.errorMessage = page.getByText(/we couldn't process your unsubscribe request/i);
  }

  async waitForCaptureReady(): Promise<void> {
    await expect
      .poll(
        async () => {
          if (await this.unsubscribedHeading.isVisible().catch(() => false)) {
            return "success";
          }
          if (await this.invalidHeading.isVisible().catch(() => false)) {
            return "invalid";
          }
          if (await this.errorHeading.isVisible().catch(() => false)) {
            return "error";
          }
          return "pending";
        },
        {
          timeout: 12000,
          intervals: [200, 500, 1000],
        },
      )
      .not.toBe("pending");

    await expect(
      this.successMessage.or(this.invalidMessage).or(this.errorMessage).first(),
    ).toBeVisible({
      timeout: 12000,
    });
    await waitForScreenshotReady(this.page);
  }
}
