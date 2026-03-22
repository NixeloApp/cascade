import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "./testUtils";

/** Archive threshold used across all tests. */
const ARCHIVE_THRESHOLD_DAYS = 7;
/** Days since done that exceed the threshold — issue should be archived. */
const DAYS_PAST_THRESHOLD = 10;
/** Days since done that are within the threshold — issue should NOT be archived. */
const DAYS_WITHIN_THRESHOLD = 3;
/** Days since done for the skip-project test — well past any threshold. */
const DAYS_PAST_THRESHOLD_NO_CONFIG = 30;

/**
 * Move an issue to the project's "done" workflow state with a backdated updatedAt.
 * Asserts that the project actually has a "done" workflow state.
 */
async function moveIssueToDone(
  t: ReturnType<typeof convexTest>,
  projectId: ReturnType<typeof createTestProject> extends Promise<infer T> ? T : never,
  issueId: ReturnType<typeof createTestIssue> extends Promise<infer T> ? T : never,
  daysAgo: number,
) {
  await t.run(async (ctx) => {
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const doneState = project.workflowStates.find(
      (s: { id: string; category: string }) => s.category === "done",
    );
    if (!doneState) {
      throw new Error("Project is missing a 'done' workflow state");
    }
    await ctx.db.patch(issueId, {
      status: doneState.id,
      updatedAt: Date.now() - daysAgo * DAY,
    });
  });
}

describe("autoArchive", () => {
  it("should archive done issues older than autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { autoArchiveDays: ARCHIVE_THRESHOLD_DAYS });
    });

    const issueId = await createTestIssue(t, projectId, userId, { title: "Old done issue" });
    await moveIssueToDone(t, projectId, issueId, DAYS_PAST_THRESHOLD);

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(1);

    const issue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issue?.archivedAt).toBeTypeOf("number");
  });

  it("should not archive done issues newer than autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { autoArchiveDays: ARCHIVE_THRESHOLD_DAYS });
    });

    const issueId = await createTestIssue(t, projectId, userId, { title: "Recent done issue" });
    await moveIssueToDone(t, projectId, issueId, DAYS_WITHIN_THRESHOLD);

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(0);
  });

  it("should skip projects without autoArchiveDays", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // No autoArchiveDays set — should be skipped
    const issueId = await createTestIssue(t, projectId, userId, { title: "Done issue" });
    await moveIssueToDone(t, projectId, issueId, DAYS_PAST_THRESHOLD_NO_CONFIG);

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(0);
  });

  it("should not archive non-done issues even if old", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { autoArchiveDays: ARCHIVE_THRESHOLD_DAYS });
    });

    // Create an issue but leave it in "todo" status (not done)
    const issueId = await createTestIssue(t, projectId, userId, { title: "Old todo issue" });
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, {
        updatedAt: Date.now() - DAYS_PAST_THRESHOLD * DAY,
      });
    });

    const result = await t.mutation(internal.autoArchive.archiveStaleDoneIssues, {});

    expect(result.totalArchived).toBe(0);
  });
});
