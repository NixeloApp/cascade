import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext, createTestUser } from "./testUtils";

describe("Membership Performance & Correctness", () => {
  it("should verify current behavior of member listing and counting", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, workspaceId, teamId, asUser } = await createTestContext(t);

    // Create a project
    const projectId = await asUser.mutation(api.projects.createProject, {
      name: "Perf Project",
      key: "PERF",
      isPublic: false,
      boardType: "kanban",
      organizationId,
      workspaceId,
      teamId,
    });

    // Create an active member
    const activeUser = await createTestUser(t, { name: "Active", email: "active@example.com" });
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: activeUser,
        role: "viewer",
        addedBy: userId,
      });
      // Also add to team
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: activeUser,
        role: "member",
        addedBy: userId,
      });
      // Also add to organization
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: activeUser,
        role: "member",
        addedBy: userId,
      });
    });

    // Create a soft-deleted member
    const deletedUser = await createTestUser(t, { name: "Deleted", email: "deleted@example.com" });
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: deletedUser,
        role: "viewer",
        addedBy: userId,
        isDeleted: true,
      });
      // Also add to team (soft deleted)
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: deletedUser,
        role: "member",
        addedBy: userId,
        isDeleted: true,
      });
      // Also add to organization
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: deletedUser,
        role: "member",
        addedBy: userId,
      });
    });

    // 1. Check Project Members List (Active only)
    const projectMembers = await asUser.query(api.projectMembers.list, { projectId });
    // Expect 2: Owner + ActiveUser. DeletedUser should be excluded.
    const activeMemberIds = projectMembers.map((m) => m.userId);
    expect(activeMemberIds).toContain(userId);
    expect(activeMemberIds).toContain(activeUser);
    expect(activeMemberIds).not.toContain(deletedUser);
    expect(projectMembers).toHaveLength(2);

    // 2. Check Team Members List (Active only)
    const teamMembers = await asUser.query(api.teams.getTeamMembers, { teamId });
    // Expect 2: Owner + ActiveUser. DeletedUser should be excluded.
    const activeTeamMemberIds = teamMembers.map((m) => m.userId);
    expect(activeTeamMemberIds).toContain(userId);
    expect(activeTeamMemberIds).toContain(activeUser);
    expect(activeTeamMemberIds).not.toContain(deletedUser);
    expect(teamMembers).toHaveLength(2);

    // 3. Check Team Member Counts (The bug)
    // getTeams returns memberCount.
    // Currently, it counts deleted members because it doesn't filter.
    // Expected behavior AFTER fix: 2.
    // Current behavior: likely 3 (Owner + Active + Deleted).
    const teams = await asUser.query(api.teams.getTeams, {
      organizationId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    const myTeam = teams.page.find((team) => team._id === teamId);
    expect(myTeam).toBeDefined();

    // NOTE: This assertion documents the CURRENT behavior (bug).
    // After fixing, this should be 2.
    // If it is 3 now, then we know the fix is needed.
    // If it is 2 now, then maybe I was wrong about the bug (or take() implies some default filter? No.)
    // Let's assert 3 for now to confirm the bug exists.
    // If this fails and says 2, then the bug doesn't exist.
    // expect(myTeam?.memberCount).toBe(3);

    // Actually, I want the test to pass AFTER fix.
    // So I will write the assertion for the FIX.
    // But currently it might fail.
    // To verify the bug, I can log it or expect 3.
    // Since I'm in the verification step, I'll write what I expect the FINAL result to be,
    // and see it fail if I run it now?
    // "Run tests" command usually expects success.

    // I will log the count to verify manually in the output.
    console.log(`Team Member Count: ${myTeam?.memberCount}`);
    expect(myTeam?.memberCount).toBe(2);
  });
});
