import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "./testUtils";

describe("autoArchive", () => {
  it("should archive done issues older than autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Enable auto-archive at 7 days
    await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { autoArchiveDays: 7 });
    });

    // Create an issue and move it to done state 10 days ago
    const issueId = await createTestIssue(t, projectId, userId, { title: "Old done issue" });
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      const doneState = project?.workflowStates.find((s) => s.category === "done");
      if (doneState) {
        await ctx.db.patch(issueId, {
          status: doneState.id,
          updatedAt: Date.now() - 10 * DAY,
        });
      }
    });

    // Run auto-archive
    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(1);

    // Verify the issue is archived
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issue?.archivedAt).toBeTypeOf("number");
  });

  it("should not archive done issues newer than autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { autoArchiveDays: 7 });
    });

    // Create a done issue updated 3 days ago (within the 7-day window)
    const issueId = await createTestIssue(t, projectId, userId, { title: "Recent done issue" });
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      const doneState = project?.workflowStates.find((s) => s.category === "done");
      if (doneState) {
        await ctx.db.patch(issueId, {
          status: doneState.id,
          updatedAt: Date.now() - 3 * DAY,
        });
      }
    });

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(0);
  });

  it("should skip projects without autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // No autoArchiveDays set — should be skipped
    const issueId = await createTestIssue(t, projectId, userId, { title: "Done issue" });
    await t.run(async (ctx) => {
      const project = await ctx.db.get(projectId);
      const doneState = project?.workflowStates.find((s) => s.category === "done");
      if (doneState) {
        await ctx.db.patch(issueId, {
          status: doneState.id,
          updatedAt: Date.now() - 30 * DAY,
        });
      }
    });

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(0);
  });
});
