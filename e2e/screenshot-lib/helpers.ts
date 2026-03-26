/**
 * Screenshot Helpers — discovery, issue drafts, and authentication.
 *
 * Utility functions used by the screenshot capture passes to discover content,
 * seed issue drafts, and handle test user login.
 */

import type { Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import { TEST_IDS } from "../../src/lib/test-ids";
import { injectAuthTokens } from "../utils/auth-helpers";
import { testUserService } from "../utils/test-user-service";
import { waitForDashboardReady, waitForScreenshotReady } from "../utils/wait-helpers";
import { BASE_URL, SCREENSHOT_USER } from "./config";
import { waitForExpectedContent } from "./readiness";

export async function discoverFirstHref(page: Page, pattern: RegExp): Promise<string | null> {
  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const match = href.match(pattern);
        if (match?.[1]) return match[1];
      }
    }
  } catch {}
  return null;
}

export async function discoverIssueKey(
  page: Page,
  orgSlug: string,
  projectKey: string,
): Promise<string | null> {
  const candidatePaths = [
    ROUTES.issues.list.build(orgSlug),
    ROUTES.projects.backlog.build(orgSlug, projectKey),
    ROUTES.projects.board.build(orgSlug, projectKey),
  ];

  for (const pathName of candidatePaths) {
    await page.goto(`${BASE_URL}${pathName}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, pathName, "issues");
    await waitForScreenshotReady(page);

    const issueKeyElement = page.getByTestId(TEST_IDS.ISSUE.KEY).first();
    if ((await issueKeyElement.count()) > 0) {
      const issueKeyText = (await issueKeyElement.textContent())?.trim();
      if (issueKeyText) {
        return issueKeyText;
      }
    }

    const issueKey = await discoverFirstHref(page, /\/issues\/([^/?#]+)/);
    if (issueKey) {
      return issueKey;
    }
  }

  return null;
}

export async function discoverDocumentId(page: Page, orgSlug: string): Promise<string | null> {
  await page.goto(`${BASE_URL}${ROUTES.documents.list.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await waitForExpectedContent(page, ROUTES.documents.list.build(orgSlug), "documents");
  await waitForScreenshotReady(page);

  const preferredTitles = [/sprint retrospective notes/i, /project requirements/i];
  const mainContent = page.getByRole("main");

  try {
    const links = mainContent.locator("a");
    const count = await links.count();

    for (const preferredTitle of preferredTitles) {
      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute("href");
        const text = (await link.innerText().catch(() => "")).trim();
        const match = href?.match(/\/documents\/([^/?#]+)/);
        const candidate = match?.[1];
        if (candidate && candidate !== "templates" && preferredTitle.test(text)) {
          return candidate;
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      const match = href?.match(/\/documents\/([^/?#]+)/);
      const candidate = match?.[1];
      if (candidate && candidate !== "templates") {
        return candidate;
      }
    }
  } catch {}

  return null;
}

export async function clearIssueDrafts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const draftKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cascade_draft_create-issue_")) {
        draftKeys.push(key);
      }
    }
    for (const key of draftKeys) {
      localStorage.removeItem(key);
    }
  });
}

export async function seedIssueDraft(page: Page, projectId: string, title: string): Promise<void> {
  await page.evaluate(
    ({ projectId, title }) => {
      localStorage.setItem(
        `cascade_draft_create-issue_${projectId}`,
        JSON.stringify({
          data: {
            title,
            description: "",
            type: "task",
            priority: "medium",
            assigneeId: "",
            storyPoints: "",
            selectedLabels: [],
          },
          timestamp: Date.now(),
        }),
      );
    },
    { projectId, title },
  );
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function autoLogin(page: Page): Promise<string | null> {
  console.log("    Creating test user...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true,
  );
  if (!createResult.success) {
    console.error(`    Failed to create user: ${createResult.error}`);
    return null;
  }
  console.log(`    User ready: ${SCREENSHOT_USER.email}`);

  // Get API token
  console.log("    Logging in via API...");
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );
  if (!(loginResult.success && loginResult.token)) {
    console.error(`    API login failed: ${loginResult.error}`);
    return null;
  }

  // Discover orgSlug by doing a lightweight seed (returns orgSlug)
  const seedProbe = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, {});
  const orgSlug = seedProbe.orgSlug;
  if (!orgSlug) {
    console.error("    Could not determine org slug from seed probe");
    return null;
  }

  // Inject tokens and navigate directly to the dashboard (bypasses /app redirect)
  await page.goto(`${BASE_URL}${ROUTES.signin.build()}`, { waitUntil: "domcontentloaded" });
  await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);
  await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, { waitUntil: "load" });

  // Wait for the dashboard to settle — the Convex auth client needs time to validate
  // the injected token and render the authenticated page
  try {
    await waitForDashboardReady(page);
  } catch {
    console.error("    Dashboard did not become ready. Current URL:", page.url());
    return null;
  }

  await waitForScreenshotReady(page);
  console.log(`    Logged in. Org: ${orgSlug}`);
  return orgSlug;
}
