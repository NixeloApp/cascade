import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("issue security vulnerability", () => {
  it("should leak assigned issues after user is removed from organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Organization, Project, User
    const ownerCtx = await createTestContext(t);
    const memberId = await createTestUser(t);
    const asMember = asAuthenticatedUser(t, memberId);

    // Add member to organization
    await ownerCtx.asUser.mutation(api.organizations.addMember, {
      organizationId: ownerCtx.organizationId,
      userId: memberId,
      role: "member",
    });

    const projectId = await createProjectInOrganization(
      t,
      ownerCtx.userId,
      ownerCtx.organizationId,
      {
        isPublic: true,
      },
    );

    // 2. Create issue assigned to member
    await createTestIssue(t, projectId, ownerCtx.userId, {
      title: "Secret Issue",
      assigneeId: memberId,
    });

    // 3. Verify member can see issue
    const resultBefore = await asMember.query(api.issues.queries.listByUser, {
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(resultBefore.page).toHaveLength(1);
    expect(resultBefore.page[0].title).toBe("Secret Issue");

    // 4. Remove member from organization
    await ownerCtx.asUser.mutation(api.organizations.removeMember, {
      organizationId: ownerCtx.organizationId,
      userId: memberId,
    });

    // 5. Verify member can STILL see issue (Vulnerability)
    const resultAfter = await asMember.query(api.issues.queries.listByUser, {
      paginationOpts: { numItems: 10, cursor: null },
    });

    // In the vulnerable state, this expects 1.
    // After fix, it should be 0.
    // I will write the test to expect the fix (0), so it fails initially.
    expect(resultAfter.page).toHaveLength(0);
  });

  it("should leak issue counts after user is removed from organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Organization, Project, User
    const ownerCtx = await createTestContext(t);
    const memberId = await createTestUser(t);
    const asMember = asAuthenticatedUser(t, memberId);

    // Add member to organization
    await ownerCtx.asUser.mutation(api.organizations.addMember, {
      organizationId: ownerCtx.organizationId,
      userId: memberId,
      role: "member",
    });

    const projectId = await createProjectInOrganization(
      t,
      ownerCtx.userId,
      ownerCtx.organizationId,
      {
        isPublic: true,
      },
    );

    // 2. Create issue assigned to member
    await createTestIssue(t, projectId, ownerCtx.userId, {
      title: "Secret Issue",
      assigneeId: memberId,
    });

    // 3. Verify member can see count
    const countBefore = await asMember.query(api.issues.queries.getUserIssueCount, {});
    expect(countBefore).toBe(1);

    // 4. Remove member from organization
    await ownerCtx.asUser.mutation(api.organizations.removeMember, {
      organizationId: ownerCtx.organizationId,
      userId: memberId,
    });

    // 5. Verify member can STILL see count (Vulnerability)
    const countAfter = await asMember.query(api.issues.queries.getUserIssueCount, {});

    // Expect 0 after fix
    expect(countAfter).toBe(0);
  });
});
