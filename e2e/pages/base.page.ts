import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { getToastLocator } from "../utils/toast-locators";

const FALLBACK_BASE_URL = process.env.BASE_URL || "http://localhost:5555";

/**
 * Base Page Object with common functionality
 * All page objects should extend this class
 *
 * IMPORTANT: orgSlug is REQUIRED. No fallbacks.
 * Tests must explicitly provide the organization context.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly orgSlug: string;
  readonly pageHeaderTitle: Locator;
  readonly offlineFallbackHeading: Locator;

  constructor(page: Page, orgSlug: string) {
    if (!orgSlug) {
      throw new Error("orgSlug is required. Tests must provide explicit organization context.");
    }
    this.page = page;
    this.orgSlug = orgSlug;
    this.pageHeaderTitle = page.getByTestId(TEST_IDS.PAGE.HEADER_TITLE);
    this.offlineFallbackHeading = page.getByTestId(TEST_IDS.PAGE.OFFLINE_FALLBACK_HEADING);
  }

  /**
   * Navigate to this page
   * Subclasses should override with specific URL using this.orgSlug
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be fully loaded and React to be hydrated
   * We avoid networkidle because Convex keeps WebSocket connections active.
   */
  async waitForLoad() {
    // Wait for scripts to load and execute
    await this.page.waitForLoadState("load");
    await this.page.locator("body.app-hydrated").waitFor({ state: "attached", timeout: 10000 });
    await expect
      .poll(
        async () => {
          const mainVisible = await isLocatorVisible(this.page.getByRole("main").last());
          if (mainVisible) {
            return true;
          }

          const visibleInteractiveCount = await getLocatorCount(
            this.page.locator("a:visible, button:visible, input:visible, textarea:visible"),
          );
          return visibleInteractiveCount > 0;
        },
        {
          timeout: 10000,
          intervals: [200, 500, 1000],
        },
      )
      .toBe(true);
  }

  /**
   * Get current URL
   */
  get url(): string {
    return this.page.url();
  }

  /**
   * Check if element is visible with auto-waiting
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await expect(locator).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  protected resolveUrl(target: string): string {
    if (/^https?:\/\//.test(target)) {
      return target;
    }

    const currentUrl = this.page.url();
    const baseUrl =
      currentUrl.startsWith("http://") || currentUrl.startsWith("https://")
        ? currentUrl
        : FALLBACK_BASE_URL;

    return new URL(target, baseUrl).toString();
  }

  protected async gotoPath(target: string, options?: Parameters<Page["goto"]>[1]) {
    await this.page.goto(this.resolveUrl(target), options);
  }

  /**
   * Get toast notification (Sonner)
   */
  getToast(text?: string): Locator {
    if (text) {
      return getToastLocator(this.page).filter({ hasText: text });
    }
    return getToastLocator(this.page);
  }

  /**
   * Wait for toast to appear
   */
  async expectToast(text: string) {
    await expect(this.getToast(text)).toBeVisible();
  }

  /**
   * Dismiss all toasts
   */
  async dismissToasts() {
    const toasts = getToastLocator(this.page);
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      await toasts.nth(i).click();
    }
  }
}
