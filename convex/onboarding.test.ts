import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Onboarding", () => {
  describe("getOnboardingStatus", () => {
    it("should return null for user without onboarding record", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status).toBeNull();
    });

    it("should return onboarding status when record exists", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      // Create onboarding record directly
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId,
          onboardingCompleted: false,
          onboardingStep: 2,
          sampleWorkspaceCreated: true,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          updatedAt: Date.now(),
        });
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status).not.toBeNull();
      expect(status?.userId).toBe(userId);
      expect(status?.onboardingCompleted).toBe(false);
      expect(status?.onboardingStep).toBe(2);
      expect(status?.sampleWorkspaceCreated).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.onboarding.getOnboardingStatus, {})).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("hasCompletedIssue", () => {
    it("should return false when user has no project memberships", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const result = await asUser.query(api.onboarding.hasCompletedIssue, {});

      expect(result).toBe(false);
    });

    it("should return false when no done issues exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId, workspaceId, teamId } = await createTestContext(t);

      // Create project with done workflow state
      const projectId = await t.run(async (ctx) => {
        const pId = await ctx.db.insert("projects", {
          name: "Test Project",
          key: "TEST",
          organizationId,
          workspaceId,
          teamId,
          ownerId: userId,
          createdBy: userId,
          updatedAt: Date.now(),
          isPublic: false,
          boardType: "kanban",
          workflowStates: [
            { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
            { id: "done", name: "Done", category: "done" as const, order: 1 },
          ],
        });
        await ctx.db.insert("projectMembers", {
          projectId: pId,
          userId,
          role: "admin",
          addedBy: userId,
        });
        return pId;
      });

      // Create an issue in todo status (not done)
      await t.run(async (ctx) => {
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId,
          teamId,
          key: "TEST-1",
          title: "Test Issue",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          assigneeId: userId,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          updatedAt: Date.now(),
        });
      });

      const result = await asUser.query(api.onboarding.hasCompletedIssue, {});

      expect(result).toBe(false);
    });

    it("should return true when user has completed issue assigned to them", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId, workspaceId, teamId } = await createTestContext(t);

      // Create project with done workflow state
      const projectId = await t.run(async (ctx) => {
        const pId = await ctx.db.insert("projects", {
          name: "Test Project",
          key: "TEST",
          organizationId,
          workspaceId,
          teamId,
          ownerId: userId,
          createdBy: userId,
          updatedAt: Date.now(),
          isPublic: false,
          boardType: "kanban",
          workflowStates: [
            { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
            { id: "done", name: "Done", category: "done" as const, order: 1 },
          ],
        });
        await ctx.db.insert("projectMembers", {
          projectId: pId,
          userId,
          role: "admin",
          addedBy: userId,
        });
        return pId;
      });

      // Create a done issue assigned to user
      await t.run(async (ctx) => {
        await ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId,
          teamId,
          key: "TEST-1",
          title: "Completed Issue",
          type: "task",
          status: "done",
          priority: "medium",
          reporterId: userId,
          assigneeId: userId,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          updatedAt: Date.now(),
        });
      });

      const result = await asUser.query(api.onboarding.hasCompletedIssue, {});

      expect(result).toBe(true);
    });
  });

  describe("updateOnboardingStatus", () => {
    it("should create new onboarding record if not exists", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      await asUser.mutation(api.onboarding.updateOnboardingStatus, {
        onboardingStep: 1,
        tourShown: true,
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status).not.toBeNull();
      expect(status?.userId).toBe(userId);
      expect(status?.onboardingStep).toBe(1);
      expect(status?.tourShown).toBe(true);
    });

    it("should update existing onboarding record", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      // Create initial record
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId,
          onboardingCompleted: false,
          onboardingStep: 0,
          sampleWorkspaceCreated: false,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          updatedAt: Date.now(),
        });
      });

      // Update it
      await asUser.mutation(api.onboarding.updateOnboardingStatus, {
        onboardingCompleted: true,
        checklistDismissed: true,
      });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});

      expect(status?.onboardingCompleted).toBe(true);
      expect(status?.checklistDismissed).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.onboarding.updateOnboardingStatus, { tourShown: true }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("createSampleProject", () => {
    it("should create sample project with demo data", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId } = await createTestContext(t);

      const projectId = await asUser.mutation(api.onboarding.createSampleProject, {
        organizationId,
      });

      expect(projectId).toBeDefined();

      // Verify project was created
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("Sample Project");
      expect(project?.key).toBe("SAMPLE");
      expect(project?.workflowStates).toHaveLength(3);

      // Verify issues were created
      const issues = await t.run(async (ctx) =>
        ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect(),
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it("should create sprint for sample project", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const projectId = await asUser.mutation(api.onboarding.createSampleProject, {
        organizationId,
      });

      const sprints = await t.run(async (ctx) =>
        ctx.db
          .query("sprints")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect(),
      );

      expect(sprints.length).toBe(1);
      expect(sprints[0].name).toBe("Sprint 1");
      expect(sprints[0].status).toBe("active");
    });

    it("should create labels for sample project", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      const projectId = await asUser.mutation(api.onboarding.createSampleProject, {
        organizationId,
      });

      const labels = await t.run(async (ctx) =>
        ctx.db
          .query("labels")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect(),
      );

      expect(labels.length).toBe(2);
      expect(labels.map((l) => l.name)).toContain("urgent");
      expect(labels.map((l) => l.name)).toContain("needs-review");
    });

    it("should reject if sample project already exists", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId, organizationId } = await createTestContext(t);

      // Create onboarding record indicating sample project already created
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId,
          onboardingCompleted: false,
          sampleWorkspaceCreated: true,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          updatedAt: Date.now(),
        });
      });

      await expect(
        asUser.mutation(api.onboarding.createSampleProject, { organizationId }),
      ).rejects.toThrow(/already created/i);
    });

    it("should reject non-organization member", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      await expect(
        asOutsider.mutation(api.onboarding.createSampleProject, { organizationId }),
      ).rejects.toThrow(/forbidden|member/i);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      await expect(
        t.mutation(api.onboarding.createSampleProject, { organizationId }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("deleteSampleProject", () => {
    it("should delete sample project and all related data", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      // First create sample project
      const projectId = await asUser.mutation(api.onboarding.createSampleProject, {
        organizationId,
      });

      // Now delete it
      await asUser.mutation(api.onboarding.deleteSampleProject, {});

      // Verify project is deleted
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project).toBeNull();

      // Verify issues are deleted
      const issues = await t.run(async (ctx) =>
        ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect(),
      );
      expect(issues).toHaveLength(0);
    });

    it("should update onboarding status after deleting sample project", async () => {
      const t = convexTest(schema, modules);
      const { asUser, organizationId } = await createTestContext(t);

      await asUser.mutation(api.onboarding.createSampleProject, { organizationId });
      await asUser.mutation(api.onboarding.deleteSampleProject, {});

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status?.sampleWorkspaceCreated).toBe(false);
    });

    it("should reject if no sample project exists", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await expect(asUser.mutation(api.onboarding.deleteSampleProject, {})).rejects.toThrow(
        /not found/i,
      );
    });
  });

  describe("checkInviteStatus", () => {
    it("should return wasInvited false when user has no invite", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const status = await asUser.query(api.onboarding.checkInviteStatus, {});

      expect(status?.wasInvited).toBe(false);
      expect(status?.inviterName).toBeNull();
    });

    it("should return invite info when user was invited", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, userId: inviterId } = await createTestContext(t);

      // Create an invite (inviteRoles are "user" or "superAdmin")
      const inviteId = await t.run(async (ctx) => {
        return await ctx.db.insert("invites", {
          email: "invited@test.com",
          organizationId,
          role: "user",
          invitedBy: inviterId,
          token: "test-token-123",
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          status: "accepted",
          updatedAt: Date.now(),
        });
      });

      // Create invited user with inviteId
      const invitedUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Invited User",
          email: "invited@test.com",
          inviteId,
        });
      });

      const asInvited = asAuthenticatedUser(t, invitedUserId);
      const status = await asInvited.query(api.onboarding.checkInviteStatus, {});

      expect(status?.wasInvited).toBe(true);
      expect(status?.inviterName).toBeDefined();
      expect(status?.inviteRole).toBe("user");
      expect(status?.organizationId).toBe(organizationId);
    });
  });

  describe("setOnboardingPersona", () => {
    it("should set persona for new user", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.mutation(api.onboarding.setOnboardingPersona, {
        persona: "team_lead",
      });

      expect(result.success).toBe(true);

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status?.onboardingPersona).toBe("team_lead");
    });

    it("should update persona for existing user", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      // Create existing onboarding record
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId,
          onboardingCompleted: false,
          sampleWorkspaceCreated: false,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          onboardingPersona: "team_member",
          updatedAt: Date.now(),
        });
      });

      await asUser.mutation(api.onboarding.setOnboardingPersona, { persona: "team_lead" });

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status?.onboardingPersona).toBe("team_lead");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.onboarding.setOnboardingPersona, { persona: "team_lead" }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("completeOnboardingFlow", () => {
    it("should mark onboarding as completed", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.mutation(api.onboarding.completeOnboardingFlow, {});

      expect(result.success).toBe(true);

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status?.onboardingCompleted).toBe(true);
      expect(status?.tourShown).toBe(true);
    });

    it("should update existing onboarding record to completed", async () => {
      const t = convexTest(schema, modules);
      const { asUser, userId } = await createTestContext(t);

      // Create existing onboarding record
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId,
          onboardingCompleted: false,
          onboardingStep: 2,
          sampleWorkspaceCreated: true,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          updatedAt: Date.now(),
        });
      });

      await asUser.mutation(api.onboarding.completeOnboardingFlow, {});

      const status = await asUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status?.onboardingCompleted).toBe(true);
      expect(status?.tourShown).toBe(true);
      // Preserved fields
      expect(status?.sampleWorkspaceCreated).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.mutation(api.onboarding.completeOnboardingFlow, {})).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("resetOnboarding", () => {
    it("should reject non-test accounts", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await expect(asUser.mutation(api.onboarding.resetOnboarding, {})).rejects.toThrow(
        /test accounts/i,
      );
    });

    it("should reset onboarding for test accounts", async () => {
      const t = convexTest(schema, modules);

      // Create a test user with mailtrap email
      const testUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          email: "test@inbox.mailtrap.io",
        });
      });

      const asTestUser = asAuthenticatedUser(t, testUserId);

      // Create onboarding record
      await t.run(async (ctx) => {
        await ctx.db.insert("userOnboarding", {
          userId: testUserId,
          onboardingCompleted: true,
          sampleWorkspaceCreated: true,
          tourShown: true,
          wizardCompleted: true,
          checklistDismissed: true,
          updatedAt: Date.now(),
        });
      });

      const result = await asTestUser.mutation(api.onboarding.resetOnboarding, {});

      expect(result.success).toBe(true);

      // Verify onboarding record is deleted
      const status = await asTestUser.query(api.onboarding.getOnboardingStatus, {});
      expect(status).toBeNull();
    });
  });
});
