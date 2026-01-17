import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Base Page Object with common functionality
 * All page objects should extend this class
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to this page
   * Subclasses should override with specific URL
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be fully loaded and React to be hydrated
   * Using 'domcontentloaded' instead of 'networkidle' because Convex
   * keeps WebSocket connections active, preventing networkidle from resolving
   */
  async waitForLoad() {
    // Wait for DOM content to load
    await this.page.waitForLoadState("domcontentloaded");

    // Wait for scripts to load and execute
    await this.page.waitForLoadState("load");

    // Wait for React hydration by checking for __reactFiber on interactive elements
    // This is more reliable than checking body since these elements are interactive
    await this.page.waitForFunction(
      () => {
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
      },
      { timeout: 30000 },
    );

    // Wait a bit more for event handlers to be fully attached
    await this.page.waitForTimeout(500);
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
      await expect(locator).toBeVisible({ timeout: 5000 });
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
      await this.page.waitForLoadState("domcontentloaded");
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

  /**
   * Get current organization slug from URL robustly.
   * Extracts slug from paths like /slug/dashboard or /slug/projects/...
   * Defaults to 'nixelo-e2e' if no valid slug is found or if on signin/landing.
   */
  getOrganizationSlug(): string {
    const url = this.page.url();
    // Match the first path segment if it's not a known system route
    const match = url.match(/^https?:\/\/[^/]+\/([^/]+)/);
    const slug = match ? match[1] : null;

    const systemRoutes = ["signin", "signup", "onboarding", "terms", "privacy", ""];
    if (!slug || systemRoutes.includes(slug) || slug === "localhost:5555") {
      return "nixelo-e2e";
    }

    return slug;
  }
}
