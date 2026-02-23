import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "../testUtils";

describe("Issue Archive", () => {
  it("should archive and restore a completed issue", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Archive Project",
      key: "ARCH",
    });

    // Create issue
    const issueId = await asUser.mutation(api.issues.create, {
      projectId,
      title: "Issue to Archive",
      type: "task",
      priority: "medium",
    });

    // Try to archive (should fail because not done)
    await expect(asUser.mutation(api.issues.archive, { issueId })).rejects.toThrow(
      "Only completed issues can be archived",
    );

    // Move to done
    await asUser.mutation(api.issues.updateStatusByCategory, {
      issueId,
      category: "done",
      newOrder: 0,
    });

    // Archive
    const result2 = await asUser.mutation(api.issues.archive, { issueId });
    expect(result2.success).toBe(true);

    const archivedIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(archivedIssue?.archivedAt).toBeDefined();

    // Restore
    const result3 = await asUser.mutation(api.issues.restore, { issueId });
    expect(result3.success).toBe(true);

    const restoredIssue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(restoredIssue?.archivedAt).toBeUndefined();
  });
});
