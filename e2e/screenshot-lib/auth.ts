import type { Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import type { TestUser } from "../config";
import { ensureUserExistsAndSignIn } from "../utils/auth-helpers";
import { waitForDashboardReady, waitForScreenshotReady } from "../utils/wait-helpers";
import { BASE_URL, SCREENSHOT_AUTH_USER } from "./config";
import { waitForSpinnersHidden } from "./readiness";

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

  if (!(await ensureUserExistsAndSignIn(page, BASE_URL, user, true))) {
    return false;
  }

  try {
    await warmAuthenticatedScreenshotPage(page, orgSlug);
    return true;
  } catch {
    return false;
  }
}
