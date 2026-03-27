import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

export class AssistantPage extends BasePage {
  readonly content: Locator;
  readonly conversationsEmptyState: Locator;
  readonly conversationsList: Locator;
  readonly conversationsTab: Locator;
  readonly loadingState: Locator;
  readonly overviewEmptyState: Locator;
  readonly overviewTab: Locator;
  readonly snapshotCard: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.ASSISTANT.CONTENT);
    this.conversationsEmptyState = page.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_EMPTY_STATE);
    this.conversationsList = page.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_LIST);
    this.conversationsTab = page.getByTestId(TEST_IDS.ASSISTANT.CONVERSATIONS_TAB);
    this.loadingState = page.getByTestId(TEST_IDS.ASSISTANT.LOADING_STATE);
    this.overviewEmptyState = page.getByTestId(TEST_IDS.ASSISTANT.OVERVIEW_EMPTY_STATE);
    this.overviewTab = page.getByTestId(TEST_IDS.ASSISTANT.OVERVIEW_TAB);
    this.snapshotCard = page.getByTestId(TEST_IDS.ASSISTANT.SNAPSHOT_CARD);
  }

  async goto() {
    await this.gotoPath(ROUTES.assistant.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.snapshotCard)) return "ready";
          if (await isLocatorVisible(this.overviewEmptyState)) return "ready";
          if (await isLocatorVisible(this.conversationsEmptyState)) return "ready";
          if (await isLocatorVisible(this.conversationsList)) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async gotoAndExpectLoadingState(timeout = 12000): Promise<void> {
    await this.goto();
    await this.expectLoadingStateVisible(timeout);
  }

  async openConversationsTab(): Promise<void> {
    await expect(this.conversationsTab).toBeVisible();
    await this.conversationsTab.click();
  }

  async openOverviewTab(): Promise<void> {
    await expect(this.overviewTab).toBeVisible();
    await this.overviewTab.click();
  }

  async expectOverviewReady(expectEmpty = false): Promise<void> {
    if (expectEmpty) {
      await expect(this.overviewEmptyState).toBeVisible();
      return;
    }

    await expect(this.snapshotCard).toBeVisible();
  }

  async expectConversationsReady(expectEmpty = false): Promise<void> {
    if (expectEmpty) {
      await expect(this.conversationsEmptyState).toBeVisible();
      return;
    }

    await expect(this.conversationsList).toBeVisible();
  }

  async expectLoadingStateVisible(timeout = 12000): Promise<void> {
    await this.loadingState.waitFor({ state: "visible", timeout });
    await expect
      .poll(() => this.page.getByTestId(TEST_IDS.LOADING.SKELETON).count(), {
        timeout,
      })
      .toBeGreaterThan(0);
  }
}
