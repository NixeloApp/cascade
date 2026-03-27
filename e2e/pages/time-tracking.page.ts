import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * Time Tracking Page Object
 * Handles tab, filter, and screenshot-review states for the admin time route.
 */
export class TimeTrackingPage extends BasePage {
  readonly burnRateHeading: Locator;
  readonly burnRatePanel: Locator;
  readonly burnRateTab: Locator;
  readonly content: Locator;
  readonly dateRangeFilter: Locator;
  readonly entryModal: Locator;
  readonly entriesEmptyState: Locator;
  readonly entriesList: Locator;
  readonly entriesTab: Locator;
  readonly addEntryButton: Locator;
  readonly projectFilter: Locator;
  readonly projectPrompt: Locator;
  readonly ratesHeading: Locator;
  readonly ratesPanel: Locator;
  readonly ratesTab: Locator;
  readonly summaryEntries: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.burnRateHeading = page.getByRole("heading", { name: /^burn rate & team costs$/i });
    this.burnRatePanel = page.getByTestId(TEST_IDS.TIME_TRACKING.BURN_RATE_PANEL);
    this.burnRateTab = page.getByTestId(TEST_IDS.TIME_TRACKING.TAB_BURN_RATE);
    this.content = page.getByTestId(TEST_IDS.TIME_TRACKING.CONTENT);
    this.dateRangeFilter = page.getByTestId(TEST_IDS.TIME_TRACKING.DATE_RANGE_FILTER);
    this.entryModal = page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_MODAL);
    this.entriesEmptyState = page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRIES_EMPTY_STATE);
    this.entriesList = page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRIES_LIST);
    this.entriesTab = page.getByTestId(TEST_IDS.TIME_TRACKING.TAB_ENTRIES);
    this.addEntryButton = page.getByTestId(TEST_IDS.TIME_TRACKING.ADD_ENTRY_BUTTON);
    this.projectFilter = page.getByTestId(TEST_IDS.TIME_TRACKING.PROJECT_FILTER);
    this.projectPrompt = page.getByRole("region", { name: /select a project/i });
    this.ratesHeading = page.getByRole("heading", { name: /^hourly rates$/i });
    this.ratesPanel = page.getByTestId(TEST_IDS.TIME_TRACKING.RATES_PANEL);
    this.ratesTab = page.getByTestId(TEST_IDS.TIME_TRACKING.TAB_RATES);
    this.summaryEntries = page.getByTestId(TEST_IDS.TIME_TRACKING.SUMMARY_ENTRIES);
  }

  async goto() {
    await this.gotoPath(ROUTES.timeTracking.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.content.waitFor({ state: "visible", timeout: 12000 });
    await this.entriesTab.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          if (
            (await isLocatorVisible(this.entriesList)) ||
            (await isLocatorVisible(this.entriesEmptyState))
          ) {
            return "ready";
          }

          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async expectEntriesState(): Promise<void> {
    await this.waitUntilReady();
    await expect
      .poll(
        async () => {
          const rowCount = await getLocatorCount(
            this.entriesList.getByRole("button", { name: /delete entry/i }),
          );
          if (rowCount > 0 || (await isLocatorVisible(this.entriesEmptyState))) {
            return "ready";
          }
          return "pending";
        },
        { timeout: 12000 },
      )
      .toBe("ready");
  }

  async openManualEntryModal(): Promise<void> {
    await this.expectEntriesState();
    await expect(this.addEntryButton).toBeVisible();
    await this.addEntryButton.click();
    await expect(this.entryModal).toBeVisible({ timeout: 12000 });
    await expect(this.entryModal.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM)).toBeVisible({
      timeout: 12000,
    });
  }

  async expectBurnRateState(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.content.waitFor({ state: "visible", timeout: 12000 });
    await this.burnRateHeading.waitFor({ state: "visible", timeout: 12000 });
    await this.burnRatePanel.waitFor({ state: "visible", timeout: 12000 });
  }

  async expectRatesState(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await this.content.waitFor({ state: "visible", timeout: 12000 });
    await this.ratesHeading.waitFor({ state: "visible", timeout: 12000 });
    await this.ratesPanel.waitFor({ state: "visible", timeout: 12000 });
  }

  async openBurnRate(projectName?: string): Promise<void> {
    if (projectName) {
      await this.selectProject(projectName);
    } else {
      await this.selectFirstProject();
    }
    await expect(this.burnRateTab).toBeVisible();
    await this.burnRateTab.click();
    await this.burnRateHeading.waitFor({ state: "visible", timeout: 12000 });
    await this.burnRatePanel.waitFor({ state: "visible", timeout: 12000 });
  }

  async openRates(projectName?: string): Promise<void> {
    if (projectName) {
      await this.selectProject(projectName);
    } else {
      await this.selectFirstProject();
    }
    await expect(this.ratesTab).toBeVisible();
    await this.ratesTab.click();
    await this.ratesHeading.waitFor({ state: "visible", timeout: 12000 });
    await this.ratesPanel.waitFor({ state: "visible", timeout: 12000 });
  }

  async selectDateRange(optionName: string): Promise<void> {
    await expect(this.dateRangeFilter).toBeVisible();
    await this.dateRangeFilter.click();
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${escapeRegExp(optionName)}$`, "i"),
    });
    await option.waitFor({ state: "visible", timeout: 5000 });
    await option.click();
    const selectedText = (await this.dateRangeFilter.textContent())?.trim() ?? "";
    if (!selectedText.includes(optionName)) {
      const fallbackMoves = DATE_RANGE_FALLBACK_MOVES[optionName];
      if (fallbackMoves === undefined) {
        throw new Error(`Unsupported date range fallback: ${optionName}`);
      }
      await this.dateRangeFilter.click();
      for (let index = 0; index < fallbackMoves; index += 1) {
        await this.page.keyboard.press("ArrowDown");
      }
      await this.page.keyboard.press("Enter");
    }
    await expect(this.dateRangeFilter).toContainText(optionName, { timeout: 5000 });
  }

  async selectProject(projectName: string): Promise<void> {
    await expect(this.projectFilter).toBeVisible();
    await this.projectFilter.click();
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${escapeRegExp(projectName)}$`, "i"),
    });
    await option.waitFor({ state: "visible", timeout: 5000 });
    await option.click();
    await expect(this.projectFilter).toContainText(projectName, { timeout: 5000 });
  }

  async selectFirstProject(): Promise<void> {
    await expect(this.projectFilter).toBeVisible();
    await this.projectFilter.click();
    const firstProjectOption = this.page.getByRole("option").nth(1);
    await expect(firstProjectOption).toBeVisible();
    const projectName = (await firstProjectOption.textContent())?.trim() ?? "";
    await firstProjectOption.click();
    const selectedText = (await this.projectFilter.textContent())?.trim() ?? "";
    if (!projectName || selectedText.includes(projectName)) {
      return;
    }

    await this.projectFilter.click();
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    if (projectName.length > 0) {
      await expect(this.projectFilter).toContainText(projectName, { timeout: 5000 });
    }
  }
}

const DATE_RANGE_FALLBACK_MOVES: Record<string, number> = {
  "All Time": 2,
  "Last 30 Days": 1,
  "Last 7 Days": 0,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
