import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Page object for the public invite route: /invite/$token
 */
export class InvitePage {
  readonly page: Page;
  readonly invalidHeading: Locator;
  readonly invalidMessage: Locator;
  readonly goHomeButton: Locator;
  readonly loadingMessage: Locator;
  readonly errorIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.invalidHeading = page.getByRole("heading", { name: /invalid invitation/i });
    this.invalidMessage = page.getByText(/this invitation link is invalid|has been removed/i);
    this.goHomeButton = page
      .getByRole("button", { name: /go to home/i })
      .or(page.getByRole("link", { name: /go to home/i }));
    this.loadingMessage = page.getByText(/loading invitation/i);
    this.errorIcon = page.locator("svg.text-status-error");
  }

  async goto(token: string, waitUntil: "commit" | "domcontentloaded" | "load" = "load") {
    await this.page.goto(`/invite/${token}`, { waitUntil });
  }

  async expectInvalidInvitation() {
    await expect(this.invalidHeading).toBeVisible();
    await expect(this.invalidMessage).toBeVisible();
    await expect(this.goHomeButton).toBeVisible();
  }

  async goHome() {
    await expect(this.goHomeButton).toBeVisible();
    await this.goHomeButton.click();
  }

  async expectLoadingOrInvalid() {
    await expect
      .poll(async () => {
        const hasLoading = await this.loadingMessage.isVisible().catch(() => false);
        const hasInvalid = await this.invalidHeading.isVisible().catch(() => false);
        return hasLoading || hasInvalid;
      })
      .toBe(true);
  }

  async expectInvalidInvitationBranding() {
    await expect(this.errorIcon).toBeVisible();
  }
}
