import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

export class InvoicesPage extends BasePage {
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
    this.createDialog = page.getByRole("dialog", { name: /create draft invoice/i });
    this.emptyState = page.getByTestId(TEST_IDS.INVOICES.EMPTY_STATE);
    this.filteredEmptyState = page.getByTestId(TEST_IDS.INVOICES.FILTERED_EMPTY_STATE);
    this.loadingState = page.getByTestId(TEST_IDS.INVOICES.LOADING_STATE);
    this.mobileList = page.getByTestId(TEST_IDS.INVOICES.MOBILE_LIST);
    this.newDraftButton = page.getByRole("button", { name: /^new draft$/i });
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

  async selectStatusFilter(label: "Draft" | "Sent" | "Paid" | "Overdue"): Promise<void> {
    await expect(this.statusFilter).toBeVisible();
    await this.statusFilter.click();
    await this.page.getByRole("option", { name: new RegExp(`^${label}$`, "i") }).click();
  }
}
