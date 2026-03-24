import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { ROUTES } from "../utils/routes";
import { waitForLoadingSkeletonsToClear } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Analytics Page Object
 * Handles the project analytics dashboard with metrics and charts.
 */
export class AnalyticsPage extends BasePage {
  readonly pageHeader: Locator;
  readonly totalIssuesMetric: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.pageHeader = page.getByTestId(TEST_IDS.ANALYTICS.PAGE_HEADER);
    this.totalIssuesMetric = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES);
  }

  async goto() {
    await this.gotoPath(ROUTES.analytics.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible", timeout: 12000 });
    await this.totalIssuesMetric.waitFor({ state: "visible", timeout: 12000 });
    await waitForLoadingSkeletonsToClear(this.page, 5000);
  }
}
