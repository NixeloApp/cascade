/**
 * Screenshot Helpers — seeded state access and issue draft utilities.
 *
 * Utility functions used by the screenshot capture passes to read the seeded
 * screenshot contract and seed issue drafts.
 */

import type { Page } from "@playwright/test";
import type { SeedScreenshotResult } from "../utils/test-user-service";

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
