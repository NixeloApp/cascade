import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestUser,
} from "./testUtils";

describe("Projects Team Injection Security", () => {
  it("should prevent creating project assigned to a team the user is not a member of", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Organization Admin
    const admin = await createTestUser(t, { name: "Admin" });
    const { organizationId, workspaceId } = await createOrganizationAdmin(t, admin);

    // 2. Setup Victim User who creates a Team
    const victim = await createTestUser(t, { name: "Victim" });
    await addUserToOrganization(t, organizationId, victim, admin);

    // Victim creates a team
    const asVictim = asAuthenticatedUser(t, victim);
    // We need to use internal mutation or helper because api.teams.create might not be exposed or checked here
    // But let's assume we can use `createProjectInOrganization` helper style or just insert directly
    // Since we are testing `projects.createProject`, let's just insert the team directly using t.run
    const victimTeamId = await t.run(async (ctx) => {
      const teamId = await ctx.db.insert("teams", {
        organizationId,
        workspaceId,
        name: "Victim Team",
        slug: "victim-team",
        isPrivate: true,
        createdBy: victim,
        updatedAt: Date.now(),
      });
      // Add victim to team
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: victim,
        role: "admin",
        addedBy: victim,
      });
      return teamId;
    });

    // 3. Setup Attacker User (Member of Workspace but NOT Team)
    const attacker = await createTestUser(t, { name: "Attacker" });
    await addUserToOrganization(t, organizationId, attacker, admin);
    // Attacker needs to be workspace member to create projects usually
    // createOrganizationAdmin adds admin as org owner.
    // addUserToOrganization adds as org member.
    // createProject checks: isOrgAdmin OR workspaceRole.
    // Org member is not enough if they don't have workspace role?
    // Let's check projects.ts:
    // const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);
    // if (!(isOrgAdmin || workspaceRole)) throw forbidden...

    // So Attacker needs workspace role.
    await t.run(async (ctx) => {
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: attacker,
        role: "member",
        addedBy: admin,
      });
    });

    const asAttacker = asAuthenticatedUser(t, attacker);

    // 4. Attacker tries to create project assigned to Victim's Team
    // This should FAIL, but currently passes
    await expect(async () => {
      await asAttacker.mutation(api.projects.createProject, {
        name: "Malicious Project",
        key: "HACK",
        organizationId,
        workspaceId,
        teamId: victimTeamId,
        boardType: "kanban",
      });
    }).rejects.toThrow(
      /You must be a team member or organization admin to assign this project to the team/,
    );
    // Note: I anticipate this error message for the fix.
    // For now, I expect it to NOT throw (or throw a different error if I was wrong about vulnerability).
    // To confirm vulnerability, I should assert that it DOES NOT throw, or just let it fail.
  });

  it("should prevent sharing project with team from different organization", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Org A and Org B
    const adminA = await createTestUser(t, { name: "Admin A" });
    const { organizationId: orgA, workspaceId: wsA } = await createOrganizationAdmin(t, adminA);

    const adminB = await createTestUser(t, { name: "Admin B" });
    const {
      organizationId: orgB,
      workspaceId: wsB,
      teamId: teamB,
    } = await createOrganizationAdmin(t, adminB);

    // 2. Attacker in Org A
    const attacker = await createTestUser(t, { name: "Attacker" });
    await addUserToOrganization(t, orgA, attacker, adminA);
    await t.run(async (ctx) => {
      await ctx.db.insert("workspaceMembers", {
        workspaceId: wsA,
        userId: attacker,
        role: "member",
        addedBy: adminA,
      });
    });

    const asAttacker = asAuthenticatedUser(t, attacker);

    // 3. Attacker tries to create project in Org A but share with Team B (from Org B)
    // This should FAIL
    await expect(async () => {
      await asAttacker.mutation(api.projects.createProject, {
        name: "Cross Org Leak",
        key: "LEAK",
        organizationId: orgA,
        workspaceId: wsA,
        boardType: "kanban",
        sharedWithTeamIds: [teamB],
      });
    }).rejects.toThrow(/Shared team must belong to the specified organization/);
  });
});
