import type { Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import type { TestUser } from "../config";
import { loginPageUserWithRepair } from "../utils/fixture-auth";
import { waitForSpinnersHidden } from "../utils/page-readiness";
import { waitForDashboardReady, waitForScreenshotReady } from "../utils/wait-helpers";
import { BASE_URL, SCREENSHOT_AUTH_USER } from "./config";

export async function warmAuthenticatedScreenshotPage(page: Page, orgSlug: string): Promise<void> {
  const dashboardUrl = `${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`;
  await page.goto(dashboardUrl, { waitUntil: "load" });
  await waitForDashboardReady(page);
  await waitForSpinnersHidden(page, 10000);
  await waitForScreenshotReady(page);
}

export async function ensureAuthenticatedScreenshotPage(
  page: Page,
  orgSlug: string,
  user: TestUser = SCREENSHOT_AUTH_USER,
): Promise<boolean> {
  try {
    await warmAuthenticatedScreenshotPage(page, orgSlug);
    return true;
  } catch {}

  try {
    await loginPageUserWithRepair(page, user, "screenshot auth fallback", true);
  } catch {
    return false;
  }

  try {
    await warmAuthenticatedScreenshotPage(page, orgSlug);
    return true;
  } catch {
    return false;
  }
}
