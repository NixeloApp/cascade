import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectLifecycleTimestampOwnershipIssues,
  run,
} from "./check-lifecycle-timestamp-ownership.js";

function fixturePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

describe("check-lifecycle-timestamp-ownership", () => {
  it("flags raw issue archive patches", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        export const archive = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(issueId, {
              archivedAt: now,
              archivedBy: ctx.userId,
              updatedAt: now,
            });
          },
        });
      `,
      fixturePath("convex/issues/mutations.ts"),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("buildIssueArchivePatch");
  });

  it("flags raw archive-state patches", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        export const archiveNotification = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(notificationId, {
              isArchived: true,
              archivedAt: Date.now(),
            });
          },
        });
      `,
      fixturePath("convex/notifications.ts"),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("archive-state helpers");
  });

  it("flags raw outreach terminal-state patches", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        export const cancelEnrollment = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(enrollmentId, {
              status: "completed",
              completedAt: Date.now(),
              nextSendAt: undefined,
            });
          },
        });
      `,
      fixturePath("convex/outreach/enrollments.ts"),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("buildCompletedEnrollmentPatch");
  });

  it("allows shared helper usage", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        import { buildIssueArchivePatch } from "../lib/lifecyclePatches";

        export const archive = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(issueId, {
              ...buildIssueArchivePatch(now, ctx.userId),
              updatedAt: now,
            });
          },
        });
      `,
      fixturePath("convex/issues/mutations.ts"),
    );

    expect(issues).toEqual([]);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
