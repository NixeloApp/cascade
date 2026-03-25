import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";

/**
 * Explicit fallback reads for Playwright locator state in polling/recovery
 * helpers. This keeps detached or mid-transition locator handling in one
 * place instead of scattering inline catch chains across E2E helpers.
 */
export async function getLocatorCount(locator: Locator): Promise<number> {
  try {
    return await locator.count();
  } catch {
    return 0;
  }
}

export async function getLocatorInputValue(locator: Locator): Promise<string | null> {
  try {
    return await locator.inputValue();
  } catch {
    return null;
  }
}

export async function getLocatorText(locator: Locator, fallback = ""): Promise<string> {
  try {
    return (await locator.textContent()) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getOptionalLocatorText(locator: Locator): Promise<string | null> {
  try {
    return await locator.textContent();
  } catch {
    return null;
  }
}

export async function getLocatorAttribute(
  locator: Locator,
  name: string,
  fallback: string | null = null,
): Promise<string | null> {
  try {
    return (await locator.getAttribute(name)) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function isLocatorDisabled(locator: Locator, fallback = false): Promise<boolean> {
  try {
    return await locator.isDisabled();
  } catch {
    return fallback;
  }
}

export async function isLocatorEditable(locator: Locator, fallback = false): Promise<boolean> {
  try {
    return await locator.isEditable();
  } catch {
    return fallback;
  }
}

export async function isLocatorVisible(locator: Locator): Promise<boolean> {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

export async function waitForLocatorVisible(locator: Locator, timeout: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

export function getPageHeaderOrGenericEmptyState(page: Page): Locator {
  return page
    .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
    .or(page.getByText(/no .+yet|nothing here yet/i))
    .first();
}
