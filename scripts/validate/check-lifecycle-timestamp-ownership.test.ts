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
        import { buildCompletedEnrollmentPatch } from "../lib/lifecyclePatches";

        export const cancelEnrollment = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(enrollmentId, buildCompletedEnrollmentPatch(now));
          },
        });
      `,
      fixturePath("convex/outreach/enrollments.ts"),
    );

    expect(issues).toEqual([]);
  });

  it("flags raw lifecycle bundles hidden inside object spreads", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        export const cancelEnrollment = authenticatedMutation({
          handler: async (ctx) => {
            await ctx.db.patch(enrollmentId, {
              ...{
                status: "completed",
                completedAt: Date.now(),
                nextSendAt: undefined,
              },
              updatedAt: Date.now(),
            });
          },
        });
      `,
      fixturePath("convex/outreach/enrollments.ts"),
    );

    expect(issues).toHaveLength(1);
  });

  it("ignores unrelated non-Convex patch APIs", () => {
    const issues = collectLifecycleTimestampOwnershipIssues(
      `
        someClient.patch(enrollmentId, {
          status: "completed",
          completedAt: Date.now(),
          nextSendAt: undefined,
        });
      `,
      fixturePath("convex/outreach/enrollments.ts"),
    );

    expect(issues).toEqual([]);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
