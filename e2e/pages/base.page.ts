import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

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

  constructor(page: Page, orgSlug: string) {
    if (!orgSlug) {
      throw new Error("orgSlug is required. Tests must provide explicit organization context.");
    }
    this.page = page;
    this.orgSlug = orgSlug;
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

    // Wait for React hydration by checking for __reactFiber on interactive elements
    // This is more reliable than checking body since these elements are interactive
    await this.page.waitForFunction(() => {
      const elements = document.querySelectorAll("a, button");
      if (elements.length === 0) return true; // No interactive elements, assume ready

      // Check if at least one element has React fiber attached
      for (const element of elements) {
        const keys = Object.keys(element);
        if (keys.some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactProps"))) {
          return true;
        }
      }
      return false;
    }, {});

    // React fiber check confirms hydration is complete
    // Event handlers are attached during hydration, no additional wait needed
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
   * Wait for navigation to complete
   */
  async waitForNavigation(url?: string | RegExp) {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForFunction(() => document.readyState === "complete");
    }
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Get toast notification (Sonner)
   */
  getToast(text?: string): Locator {
    if (text) {
      return this.page.locator("[data-sonner-toast]").filter({ hasText: text });
    }
    return this.page.locator("[data-sonner-toast]");
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
    const toasts = this.page.locator("[data-sonner-toast]");
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      await toasts.nth(i).click();
    }
  }
}
