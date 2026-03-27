import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { withConvexLoadingPage } from "../utils/convex-loading";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

export class InvoicesPage extends BasePage {
  static async withLoadingPage<T>(
    sourcePage: Page,
    orgSlug: string,
    run: (invoicesPage: InvoicesPage) => Promise<T>,
  ): Promise<T> {
    return withConvexLoadingPage(sourcePage, async (loadingPage) =>
      run(new InvoicesPage(loadingPage, orgSlug)),
    );
  }

  readonly content: Locator;
  readonly createDialog: Locator;
  readonly emptyState: Locator;
  readonly filteredEmptyState: Locator;
  readonly loadingState: Locator;
  readonly mobileList: Locator;
  readonly newDraftButton: Locator;
  readonly statusFilter: Locator;
  readonly table: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.content = page.getByTestId(TEST_IDS.INVOICES.CONTENT);
    this.createDialog = page.getByTestId(TEST_IDS.INVOICES.CREATE_DIALOG);
    this.emptyState = page.getByTestId(TEST_IDS.INVOICES.EMPTY_STATE);
    this.filteredEmptyState = page.getByTestId(TEST_IDS.INVOICES.FILTERED_EMPTY_STATE);
    this.loadingState = page.getByTestId(TEST_IDS.INVOICES.LOADING_STATE);
    this.mobileList = page.getByTestId(TEST_IDS.INVOICES.MOBILE_LIST);
    this.newDraftButton = page.getByTestId(TEST_IDS.INVOICES.NEW_DRAFT_BUTTON);
    this.statusFilter = page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER);
    this.table = page.getByTestId(TEST_IDS.INVOICES.TABLE);
  }

  async goto(): Promise<void> {
    await this.gotoPath(ROUTES.invoices.list.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.table)) return "ready";
          if (await isLocatorVisible(this.mobileList)) return "ready";
          if (await isLocatorVisible(this.emptyState)) return "ready";
          if (await isLocatorVisible(this.filteredEmptyState)) return "ready";
          if (await isLocatorVisible(this.loadingState)) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async expectPopulatedStateVisible(): Promise<void> {
    await expect(this.content).toBeVisible();
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.table)) return "ready";
          if (await isLocatorVisible(this.mobileList)) return "ready";
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async expectFilteredEmptyStateVisible(): Promise<void> {
    await expect(this.filteredEmptyState).toBeVisible();
  }

  async expectLoadingStateVisible(timeout = 12000): Promise<void> {
    await this.loadingState.waitFor({ state: "visible", timeout });
  }

  async openCreateDialog(): Promise<void> {
    await expect(this.newDraftButton).toBeVisible();
    await this.newDraftButton.click();
    await expect(this.createDialog).toBeVisible();
  }

  async selectStatusFilter(status: "all" | "draft" | "sent" | "paid" | "overdue"): Promise<void> {
    await expect(this.statusFilter).toBeVisible();
    await this.statusFilter.click();

    switch (status) {
      case "all":
        await this.page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER_OPTION_ALL).click();
        return;
      case "draft":
        await this.page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER_OPTION_DRAFT).click();
        return;
      case "sent":
        await this.page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER_OPTION_SENT).click();
        return;
      case "paid":
        await this.page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER_OPTION_PAID).click();
        return;
      case "overdue":
        await this.page.getByTestId(TEST_IDS.INVOICES.STATUS_FILTER_OPTION_OVERDUE).click();
        return;
    }
  }
}
