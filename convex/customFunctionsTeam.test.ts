import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createTestContext,
  createTestUser,
  expectThrowsAsync,
} from "./testUtils";

describe("Custom Functions Team Access Control", () => {
  describe("Team Access (teamQuery)", () => {
    it("should allow team members to access team data", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      // 2. Create Member User
      const memberId = await createTestUser(t);
      const asMember = asAuthenticatedUser(t, memberId);

      // Add to Org
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      // Add to Team
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      // 3. Member calls teamQuery (getTeamMembers)
      const members = await asMember.query(api.teams.getTeamMembers, { teamId });
      expect(members).toBeDefined();
      expect(members.length).toBeGreaterThan(0);
    });

    it("should allow organization admins to access team data even if not in team", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      // Owner is already Org Admin and Team Admin (creator), so let's create ANOTHER Org Admin
      const adminId = await createTestUser(t);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Add to Org as Admin
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: adminId,
        role: "admin",
      });

      // DO NOT Add to Team

      // 3. Org Admin calls teamQuery (getTeamMembers)
      const members = await asAdmin.query(api.teams.getTeamMembers, { teamId });
      expect(members).toBeDefined();
      // Should see at least the owner
      expect(members.length).toBeGreaterThan(0);
    });

    it("should prevent non-members from accessing team data", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Test Team",
        isPrivate: false,
      });

      // 2. Create Non-Member User (but in Org)
      const outsiderId = await createTestUser(t);
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      // Add to Org as Member
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: outsiderId,
        role: "member",
      });

      // DO NOT Add to Team

      // 3. Outsider calls teamQuery (getTeamMembers)
      await expectThrowsAsync(async () => {
        await asOutsider.query(api.teams.getTeamMembers, { teamId });
      }, "You must be a team member or organization admin to access this team");
    });
  });

  describe("Team Lead Mutation (teamLeadMutation)", () => {
    it("should allow team admins to update team", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team Alpha",
        isPrivate: false,
      });

      // 2. Create Team Admin User
      const teamAdminId = await createTestUser(t);
      const asTeamAdmin = asAuthenticatedUser(t, teamAdminId);

      // Add to Org
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: teamAdminId,
        role: "member",
      });

      // Add to Team as Admin
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: teamAdminId,
        role: "admin",
      });

      // 3. Team Admin calls teamLeadMutation (updateTeam)
      await asTeamAdmin.mutation(api.teams.updateTeam, {
        teamId,
        description: "Updated by Team Admin",
      });

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.description).toBe("Updated by Team Admin");
    });

    it("should allow organization admins to update team", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team Beta",
        isPrivate: false,
      });

      // 2. Create Another Org Admin
      const orgAdminId = await createTestUser(t);
      const asOrgAdmin = asAuthenticatedUser(t, orgAdminId);

      // Add to Org as Admin
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: orgAdminId,
        role: "admin",
      });

      // DO NOT Add to Team

      // 3. Org Admin calls teamLeadMutation (updateTeam)
      await asOrgAdmin.mutation(api.teams.updateTeam, {
        teamId,
        description: "Updated by Org Admin",
      });

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.description).toBe("Updated by Org Admin");
    });

    it("should prevent regular team members from updating team", async () => {
      const t = convexTest(schema, modules);

      // 1. Create Org and Team
      const { organizationId, workspaceId, asUser: asOwner } = await createTestContext(t);
      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        organizationId,
        workspaceId,
        name: "Team Gamma",
        isPrivate: false,
      });

      // 2. Create Regular Team Member
      const memberId = await createTestUser(t);
      const asMember = asAuthenticatedUser(t, memberId);

      // Add to Org
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: memberId,
        role: "member",
      });

      // Add to Team as Member
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      // 3. Regular Member calls teamLeadMutation (updateTeam)
      await expectThrowsAsync(async () => {
        await asMember.mutation(api.teams.updateTeam, {
          teamId,
          description: "Hacking attempt",
        });
      }, "Only team leads or organization admins can perform this action");
    });
  });
});
