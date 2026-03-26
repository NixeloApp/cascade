import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";

type InviteRouteState = "loading" | "invalid" | "expired" | "revoked" | "accepted" | "pending";

/**
 * Page object for the public invite route: /invite/$token
 */
export class InvitePage {
  readonly page: Page;
  readonly stateScreen: Locator;
  readonly loadingState: Locator;
  readonly invalidHeading: Locator;
  readonly expiredHeading: Locator;
  readonly revokedHeading: Locator;
  readonly acceptedHeading: Locator;
  readonly invalidMessage: Locator;
  readonly goHomeButton: Locator;
  readonly goToDashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stateScreen = page.getByTestId(TEST_IDS.INVITE.STATE_SCREEN);
    this.loadingState = page.getByTestId(TEST_IDS.INVITE.LOADING);
    this.invalidHeading = page.getByRole("heading", { name: /invalid invitation/i });
    this.expiredHeading = page.getByRole("heading", { name: /invitation expired/i });
    this.revokedHeading = page.getByRole("heading", { name: /invitation revoked/i });
    this.acceptedHeading = page.getByRole("heading", { name: /already accepted/i });
    this.invalidMessage = page.getByText(/this invitation link is invalid|has been removed/i);
    this.goHomeButton = page
      .getByRole("button", { name: /go to home/i })
      .or(page.getByRole("link", { name: /go to home/i }));
    this.goToDashboardButton = page
      .getByRole("button", { name: /go to dashboard/i })
      .or(page.getByRole("link", { name: /go to dashboard/i }));
  }

  async goto(token: string, waitUntil: "commit" | "domcontentloaded" | "load" = "load") {
    await this.page.goto(ROUTES.invite.build(token), { waitUntil });
  }

  async expectInvalidInvitation() {
    await expect(this.stateScreen).toBeVisible();
    await expect(this.invalidHeading).toBeVisible();
    await expect(this.invalidMessage).toBeVisible();
    await expect(this.goHomeButton).toBeVisible();
  }

  async goHome() {
    await expect(this.goHomeButton).toBeVisible();
    await this.goHomeButton.click();
  }

  async expectLoadingOrInvalid() {
    await expect.poll(async () => this.getInviteRouteState()).not.toBe("pending");
  }

  async expectInvalidInvitationBranding() {
    await expect(this.stateScreen).toBeVisible();
  }

  async expectExpiredInvitation() {
    await expect(this.stateScreen).toBeVisible();
    await expect(this.expiredHeading).toBeVisible();
    await expect(this.goHomeButton).toBeVisible();
  }

  async expectRevokedInvitation() {
    await expect(this.stateScreen).toBeVisible();
    await expect(this.revokedHeading).toBeVisible();
    await expect(this.goHomeButton).toBeVisible();
  }

  async expectAcceptedInvitation() {
    await expect(this.stateScreen).toBeVisible();
    await expect(this.acceptedHeading).toBeVisible();
    await expect(this.goToDashboardButton).toBeVisible();
  }

  private async getInviteRouteState(): Promise<InviteRouteState> {
    if (await isLocatorVisible(this.invalidHeading)) {
      return "invalid";
    }

    if (await isLocatorVisible(this.expiredHeading)) {
      return "expired";
    }

    if (await isLocatorVisible(this.revokedHeading)) {
      return "revoked";
    }

    if (await isLocatorVisible(this.acceptedHeading)) {
      return "accepted";
    }

    if (await isLocatorVisible(this.loadingState)) {
      return "loading";
    }

    return "pending";
  }
}
