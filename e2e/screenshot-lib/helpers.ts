/**
 * Screenshot Helpers — seeded state access, issue drafts, and authentication.
 *
 * Utility functions used by the screenshot capture passes to read the seeded
 * screenshot contract, seed issue drafts, and handle test user login.
 */

import type { Page } from "@playwright/test";
import { ensureUserExistsAndSignIn } from "../utils/auth-helpers";
import { type SeedScreenshotResult, testUserService } from "../utils/test-user-service";
import { waitForScreenshotReady } from "../utils/wait-helpers";
import { BASE_URL, SCREENSHOT_AUTH_USER, SCREENSHOT_USER } from "./config";

export function getSeededIssueKey(seed: SeedScreenshotResult): string | null {
  return seed.issueKeys?.[0] ?? null;
}

export function requireSeededIssueKey(seed: SeedScreenshotResult, context: string): string {
  const issueKey = getSeededIssueKey(seed);
  if (issueKey) {
    return issueKey;
  }

  throw new Error(`Missing seeded issue key for ${context}`);
}

export function getPrimarySeededDocumentId(seed: SeedScreenshotResult): string | null {
  return (
    seed.documentIds?.sprintRetrospectiveNotes ?? seed.documentIds?.projectRequirements ?? null
  );
}

export function requirePrimarySeededDocumentId(
  seed: SeedScreenshotResult,
  context: string,
): string {
  const documentId = getPrimarySeededDocumentId(seed);
  if (documentId) {
    return documentId;
  }

  throw new Error(`Missing seeded document id for ${context}`);
}

export function getSeededTeamSlug(seed: SeedScreenshotResult): string | null {
  return seed.teamSlug ?? null;
}

export function requireSeededTeamSlug(seed: SeedScreenshotResult, context: string): string {
  const teamSlug = getSeededTeamSlug(seed);
  if (teamSlug) {
    return teamSlug;
  }

  throw new Error(`Missing seeded team slug for ${context}`);
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

  // Discover orgSlug by doing a lightweight seed (returns orgSlug)
  const seedProbe = await testUserService.seedScreenshotData(SCREENSHOT_USER.email, {});
  const orgSlug = seedProbe.orgSlug;
  if (!orgSlug) {
    console.error("    Could not determine org slug from seed probe");
    return null;
  }

  console.log("    Logging in via reusable auth helper...");
  if (!(await ensureUserExistsAndSignIn(page, BASE_URL, SCREENSHOT_AUTH_USER, true))) {
    console.error(
      "    Screenshot auth helper could not reach the dashboard. Current URL:",
      page.url(),
    );
    return null;
  }

  await waitForScreenshotReady(page);
  console.log(`    Logged in. Org: ${orgSlug}`);
  return orgSlug;
}
