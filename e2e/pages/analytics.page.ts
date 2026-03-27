import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { withSiblingPageTarget } from "../utils/page-targets";
import { ROUTES } from "../utils/routes";
import { waitForLoadingSkeletonsToClear } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

/**
 * Analytics Page Object
 * Handles the organization analytics dashboard with metrics and charts.
 */
export class AnalyticsPage extends BasePage {
  static async withCapturePage<T>(
    sourcePage: Page,
    orgSlug: string,
    run: (analyticsPage: AnalyticsPage) => Promise<T>,
  ): Promise<T> {
    return withSiblingPageTarget(sourcePage, async ({ page }) =>
      run(new AnalyticsPage(page, orgSlug)),
    );
  }

  readonly analyticsPage: Locator;
  readonly pageHeader: Locator;
  readonly totalIssuesMetric: Locator;
  readonly completedMetric: Locator;
  readonly unassignedMetric: Locator;
  readonly projectsMetric: Locator;
  readonly periodSelect: Locator;
  readonly typeChart: Locator;
  readonly priorityChart: Locator;
  readonly projectsChart: Locator;
  readonly trendSection: Locator;
  readonly projectBreakdown: Locator;
  readonly emptyState: Locator;
  readonly projectBreakdownEmptyState: Locator;
  readonly truncationNotice: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.analyticsPage = page.getByTestId(TEST_IDS.ANALYTICS.ORG_PAGE);
    this.pageHeader = page.getByTestId(TEST_IDS.ANALYTICS.PAGE_HEADER);
    this.totalIssuesMetric = page.getByTestId(TEST_IDS.ANALYTICS.METRIC_TOTAL_ISSUES);
    this.completedMetric = page.getByTestId(TEST_IDS.ANALYTICS.ORG_METRIC_COMPLETED);
    this.unassignedMetric = page.getByTestId(TEST_IDS.ANALYTICS.ORG_METRIC_UNASSIGNED);
    this.projectsMetric = page.getByTestId(TEST_IDS.ANALYTICS.ORG_METRIC_PROJECTS);
    this.periodSelect = page.getByTestId(TEST_IDS.ANALYTICS.ORG_PERIOD_SELECT);
    this.typeChart = page.getByTestId(TEST_IDS.ANALYTICS.ORG_CHART_TYPE);
    this.priorityChart = page.getByTestId(TEST_IDS.ANALYTICS.ORG_CHART_PRIORITY);
    this.projectsChart = page.getByTestId(TEST_IDS.ANALYTICS.ORG_CHART_PROJECTS);
    this.trendSection = page.getByTestId(TEST_IDS.ANALYTICS.ORG_TREND_SECTION);
    this.projectBreakdown = page.getByTestId(TEST_IDS.ANALYTICS.ORG_PROJECT_BREAKDOWN);
    this.emptyState = page.getByTestId(TEST_IDS.ANALYTICS.ORG_EMPTY_STATE);
    this.projectBreakdownEmptyState = page.getByTestId(
      TEST_IDS.ANALYTICS.ORG_PROJECT_BREAKDOWN_EMPTY,
    );
    this.truncationNotice = page.getByTestId(TEST_IDS.ANALYTICS.ORG_TRUNCATION_NOTICE);
  }

  async goto() {
    await this.gotoPath(ROUTES.analytics.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible", timeout: 12000 });
    await this.totalIssuesMetric.waitFor({ state: "visible", timeout: 12000 });
    await this.periodSelect.waitFor({ state: "visible", timeout: 12000 });
    await waitForLoadingSkeletonsToClear(this.page, 5000);
  }

  async expectCanonicalState(): Promise<void> {
    await this.waitUntilReady();
    await this.completedMetric.waitFor({ state: "visible", timeout: 12000 });
    await this.unassignedMetric.waitFor({ state: "visible", timeout: 12000 });
    await this.projectsMetric.waitFor({ state: "visible", timeout: 12000 });
    await this.typeChart.waitFor({ state: "visible", timeout: 12000 });
    await this.priorityChart.waitFor({ state: "visible", timeout: 12000 });
    await this.projectsChart.waitFor({ state: "visible", timeout: 12000 });
    await this.projectBreakdown.waitFor({ state: "visible", timeout: 12000 });
  }

  async expectNoActivityState(): Promise<void> {
    await this.waitUntilReady();
    await this.emptyState.waitFor({ state: "visible", timeout: 12000 });
    await this.projectBreakdownEmptyState.waitFor({ state: "visible", timeout: 12000 });
  }
}
