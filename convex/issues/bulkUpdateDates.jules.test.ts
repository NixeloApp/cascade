import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createProjectInOrganization, createTestContext, createTestIssue } from "../testUtils";

describe("Bulk Update Dates", () => {
  it("should validate dueDate against startDate", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Date Validation Project",
      key: "DATE",
    });

    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Issue with Start Date",
    });

    const now = Date.now();
    const startDate = now;

    // Patch issue with startDate
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, { startDate });
    });

    // Attempt to set dueDate before startDate (should fail validation and skip update)
    const invalidDueDate = startDate - 10000;
    const resultInvalid = await asUser.mutation(api.issues.bulkUpdateDueDate, {
      issueIds: [issueId],
      dueDate: invalidDueDate,
    });

    expect(resultInvalid.updated).toBe(0);

    const issueAfterInvalid = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issueAfterInvalid?.dueDate).toBeUndefined();

    // Attempt to set valid dueDate (after startDate)
    const validDueDate = startDate + 10000;
    const resultValid = await asUser.mutation(api.issues.bulkUpdateDueDate, {
      issueIds: [issueId],
      dueDate: validDueDate,
    });

    expect(resultValid.updated).toBe(1);

    const issueAfterValid = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issueAfterValid?.dueDate).toBe(validDueDate);
  });

  it("should validate startDate against dueDate", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Date Validation Project 2",
      key: "DATE2",
    });

    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Issue with Due Date",
    });

    const now = Date.now();
    const dueDate = now + 100000;

    // Patch issue with dueDate
    await t.run(async (ctx) => {
      await ctx.db.patch(issueId, { dueDate });
    });

    // Attempt to set startDate after dueDate (should fail validation and skip update)
    const invalidStartDate = dueDate + 10000;
    const resultInvalid = await asUser.mutation(api.issues.bulkUpdateStartDate, {
      issueIds: [issueId],
      startDate: invalidStartDate,
    });

    expect(resultInvalid.updated).toBe(0);

    const issueAfterInvalid = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issueAfterInvalid?.startDate).toBeUndefined();

    // Attempt to set valid startDate (before dueDate)
    const validStartDate = dueDate - 10000;
    const resultValid = await asUser.mutation(api.issues.bulkUpdateStartDate, {
      issueIds: [issueId],
      startDate: validStartDate,
    });

    expect(resultValid.updated).toBe(1);

    const issueAfterValid = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issueAfterValid?.startDate).toBe(validStartDate);
  });
});
