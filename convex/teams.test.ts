import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Teams", () => {
  describe("createTeam", () => {
    it("should create a team for organization members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId, slug } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Engineering",
        isPrivate: false,
      });

      expect(teamId).toBeDefined();
      expect(slug).toBe("engineering");

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.name).toBe("Engineering");
      expect(team?.organizationId).toBe(organizationId);

      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-organization members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId } = await createTestContext(t);

      const outsiderId = await createTestUser(t);
      const asOutsider = asAuthenticatedUser(t, outsiderId);
      await expect(async () => {
        await asOutsider.mutation(api.teams.createTeam, {
          organizationId,
          workspaceId,
          name: "Hacker Team",
          isPrivate: false,
        });
      }).rejects.toThrow("You must be an organization member to perform this action");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("softDelete and restore", () => {
    it("should soft delete and restore a team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Restore Me",
        isPrivate: false,
      });

      // Soft delete
      const deleteResult = await asOwner.mutation(api.teams.softDeleteTeam, { teamId });
      expect(deleteResult).toEqual({ success: true, deleted: true });

      const deletedTeam = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(deletedTeam?.isDeleted).toBe(true);
      expect(deletedTeam?.deletedAt).toBeDefined();

      // Restore
      const restoreResult = await asOwner.mutation(api.teams.restoreTeam, { teamId });
      expect(restoreResult).toEqual({ success: true, restored: true });

      const restoredTeam = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(restoredTeam?.isDeleted).toBeUndefined();
      expect(restoredTeam?.deletedAt).toBeUndefined();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("members", () => {
    it("should add and remove team members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      // Add user to organization first
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team A",
        isPrivate: false,
      });

      // Add to team
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      const members = await asOwner.query(api.teams.getTeamMembers, { teamId });
      expect(members).toHaveLength(2); // Owner + Member

      // Remove from team
      const result = await asOwner.mutation(api.teams.removeTeamMember, {
        teamId,
        userId: memberId,
      });
      expect(result).toEqual({ success: true, deleted: true });

      const membersAfter = await asOwner.query(api.teams.getTeamMembers, { teamId });
      expect(membersAfter).toHaveLength(1);

      await t.finishInProgressScheduledFunctions();
    });

    it("should enforce organization membership constraint", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const outsiderId = await createTestUser(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team A",
        isPrivate: false,
      });

      await expect(async () => {
        await asOwner.mutation(api.teams.addTeamMember, {
          teamId,
          userId: outsiderId,
          role: "member",
        });
      }).rejects.toThrow("User must be an organization member to join this team");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("queries", () => {
    it("should list organization teams", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      await asUser.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team 1",
        isPrivate: false,
      });

      await asUser.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team 2",
        isPrivate: false,
      });

      const teams = await asUser.query(api.teams.getOrganizationTeams, { organizationId });
      expect(teams).toHaveLength(3); // Engineering (default) + Team 1 + Team 2

      await t.finishInProgressScheduledFunctions();
    });

    it("should list user teams", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      await asUser.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team 1",
        isPrivate: false,
      });
      // Auto joined as admin

      const teams = await asUser.query(api.teams.getUserTeams, {});
      expect(teams).toHaveLength(2); // Engineering (default) + Team 1
      expect(teams.map((t) => t.name)).toContain("Team 1");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateTeam", () => {
    it("should allow team admin to update team name", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Original Name",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.updateTeam, {
        teamId,
        name: "Updated Name",
      });

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.name).toBe("Updated Name");
      expect(team?.slug).toBe("updated-name");

      await t.finishInProgressScheduledFunctions();
    });

    it("should allow team admin to update description", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.updateTeam, {
        teamId,
        description: "A great team",
      });

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.description).toBe("A great team");

      await t.finishInProgressScheduledFunctions();
    });

    it("should allow team admin to update privacy", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.updateTeam, {
        teamId,
        isPrivate: true,
      });

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.isPrivate).toBe(true);

      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin from updating team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      // Add member as regular team member
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      await expect(async () => {
        await asMember.mutation(api.teams.updateTeam, {
          teamId,
          name: "Hacked Name",
        });
      }).rejects.toThrow();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("updateTeamMemberRole", () => {
    it("should update team member role", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      await asOwner.mutation(api.teams.updateTeamMemberRole, {
        teamId,
        userId: memberId,
        role: "admin",
      });

      const membership = await t.run(async (ctx) =>
        ctx.db
          .query("teamMembers")
          .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", memberId))
          .first(),
      );

      expect(membership?.role).toBe("admin");

      await t.finishInProgressScheduledFunctions();
    });

    it("should throw not found for non-member", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const nonMemberId = await createTestUser(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      await expect(async () => {
        await asOwner.mutation(api.teams.updateTeamMemberRole, {
          teamId,
          userId: nonMemberId,
          role: "admin",
        });
      }).rejects.toThrow();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getTeam", () => {
    it("should return team with user role for members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      const team = await asOwner.query(api.teams.getTeam, { id: teamId });

      expect(team).not.toBeNull();
      expect(team?.name).toBe("Test Team");
      expect(team?.userRole).toBe("admin");
      expect(team?.isAdmin).toBe(true);

      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for deleted team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "To Delete",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.softDeleteTeam, { teamId });

      const team = await asOwner.query(api.teams.getTeam, { id: teamId });
      expect(team).toBeNull();

      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-members of private team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Private Team",
        isPrivate: true,
      });

      const asMember = asAuthenticatedUser(t, memberId);
      const team = await asMember.query(api.teams.getTeam, { id: teamId });
      expect(team).toBeNull();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getBySlug", () => {
    it("should return team by slug", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { slug } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "My Team",
        isPrivate: false,
      });

      const team = await asOwner.query(api.teams.getBySlug, {
        workspaceId,
        slug,
      });

      expect(team).not.toBeNull();
      expect(team?.name).toBe("My Team");

      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-existent slug", async () => {
      const t = convexTest(schema, modules);
      const { workspaceId, asUser: asOwner } = await createTestContext(t);

      const team = await asOwner.query(api.teams.getBySlug, {
        workspaceId,
        slug: "non-existent",
      });

      expect(team).toBeNull();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getTeams (paginated)", () => {
    it("should return paginated teams for org admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Alpha",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Beta",
        isPrivate: false,
      });

      const result = await asOwner.query(api.teams.getTeams, {
        organizationId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      expect(result.page.length).toBeGreaterThanOrEqual(2);

      await t.finishInProgressScheduledFunctions();
    });

    it("should return only member teams for non-admin", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Member Team",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      // Create another team where member is NOT added
      await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Other Team",
        isPrivate: false,
      });

      const asMember = asAuthenticatedUser(t, memberId);
      const result = await asMember.query(api.teams.getTeams, {
        organizationId,
        paginationOpts: { numItems: 10, cursor: null },
      });

      // Member should only see the team they belong to
      expect(result.page.some((team) => team.name === "Member Team")).toBe(true);
      expect(result.page.some((team) => team.name === "Other Team")).toBe(false);

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getTeamUserRole", () => {
    it("should return user role in team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      const role = await asOwner.query(api.teams.getTeamUserRole, { teamId });
      expect(role).toBe("admin");

      await t.finishInProgressScheduledFunctions();
    });

    it("should return null for non-members", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const outsiderId = await createTestUser(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      const asOutsider = asAuthenticatedUser(t, outsiderId);
      const role = await asOutsider.query(api.teams.getTeamUserRole, { teamId });
      expect(role).toBeNull();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("slug generation", () => {
    it("should generate unique slugs for duplicate names", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { slug: slug1 } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Marketing",
        isPrivate: false,
      });

      const { slug: slug2 } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Marketing",
        isPrivate: false,
      });

      expect(slug1).toBe("marketing");
      expect(slug2).toBe("marketing-1");

      await t.finishInProgressScheduledFunctions();
    });

    it("should handle special characters in name", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { slug } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "R&D / Innovation!!!",
        isPrivate: false,
      });

      expect(slug).toBe("r-d-innovation");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("addTeamMember", () => {
    it("should deny duplicate member addition", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      await expect(async () => {
        await asOwner.mutation(api.teams.addTeamMember, {
          teamId,
          userId: memberId,
          role: "member",
        });
      }).rejects.toThrow("User is already a member of this team");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("restoreTeam", () => {
    it("should deny restoring non-deleted team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Active Team",
        isPrivate: false,
      });

      await expect(async () => {
        await asOwner.mutation(api.teams.restoreTeam, { teamId });
      }).rejects.toThrow("Team is not deleted");

      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin from restoring team", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const memberId = await createTestUser(t);

      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "To Delete",
        isPrivate: false,
      });

      await asOwner.mutation(api.teams.softDeleteTeam, { teamId });

      const asMember = asAuthenticatedUser(t, memberId);

      await expect(async () => {
        await asMember.mutation(api.teams.restoreTeam, { teamId });
      }).rejects.toThrow(
        "Only organization admins or the user who deleted the team can restore it",
      );

      await t.finishInProgressScheduledFunctions();
    });
  });
});
