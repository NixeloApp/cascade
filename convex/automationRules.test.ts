import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Automation Rules", () => {
  describe("list", () => {
    it("should return automation rules for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create automation rule
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-assign bugs",
        description: "Automatically assign bugs to lead",
        trigger: "issue_created",
        triggerValue: "bug",
        actionType: "set_assignee",
        actionValue: { type: "set_assignee", assigneeId: userId },
      });

      const rules = await asUser.query(api.automationRules.list, { projectId });

      expect(rules).toHaveLength(1);
      expect(rules[0]?._id).toBe(ruleId);
      expect(rules[0]?.name).toBe("Auto-assign bugs");
    });

    it("should return empty array for project with no rules", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const rules = await asUser.query(api.automationRules.list, { projectId });

      expect(rules).toEqual([]);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(t.query(api.automationRules.list, { projectId })).rejects.toThrow(
        "Not authenticated",
      );
    });

    it("should deny non-members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOther = asAuthenticatedUser(t, other);

      await expect(asOther.query(api.automationRules.list, { projectId })).rejects.toThrow(
        "Not authorized",
      );
    });

    it("should return rules for project members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, owner);
      const projectId = await createProjectInOrganization(t, owner, organizationId);

      // Add member to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: member,
          role: "member",
          addedBy: owner,
        });
      });

      // Add member
      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "member@test.com",
        role: "viewer",
      });

      // Create rule
      await asOwner.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      // Member views rules
      const asMember = asAuthenticatedUser(t, member);
      const rules = await asMember.query(api.automationRules.list, { projectId });

      expect(rules).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should create automation rule with all fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-prioritize bugs",
        description: "Set bugs to high priority",
        trigger: "issue_created",
        triggerValue: "bug",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule?.name).toBe("Auto-prioritize bugs");
      expect(rule?.description).toBe("Set bugs to high priority");
      expect(rule?.trigger).toBe("issue_created");
      expect(rule?.triggerValue).toBe("bug");
      expect(rule?.actionType).toBe("set_priority");
      expect(rule?.isActive).toBe(true);
      expect(rule?.executionCount).toBe(0);
      expect(rule?.createdBy).toBe(userId);
    });

    it("should create rule with minimal fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Simple Rule",
        trigger: "issue_created",
        actionType: "add_label",
        actionValue: { type: "add_label", label: "automated" },
      });

      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule?.name).toBe("Simple Rule");
      expect(rule?.description).toBeUndefined();
      expect(rule?.triggerValue).toBeUndefined();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, owner);
      const projectId = await createProjectInOrganization(t, owner, organizationId);

      // Add editor to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: editor,
          role: "member",
          addedBy: owner,
        });
      });

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Editor tries to create rule - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);
      await expect(async () => {
        await asEditor.mutation(api.automationRules.create, {
          projectId,
          name: "Rule",
          trigger: "issue_created",
          actionType: "set_priority",
          actionValue: { type: "set_priority", priority: "high" },
        });
      }).rejects.toThrow(/FORBIDDEN|admin/i);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.mutation(api.automationRules.create, {
          projectId,
          name: "Rule",
          trigger: "issue_created",
          actionType: "set_priority",
          actionValue: { type: "set_priority", priority: "high" },
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("update", () => {
    it("should update automation rule fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Original Name",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "medium" },
      });

      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        name: "Updated Name",
        description: "Added description",
        actionValue: { type: "set_priority", priority: "high" },
      });

      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule?.name).toBe("Updated Name");
      expect(rule?.description).toBe("Added description");
      expect(rule?.actionValue).toEqual({ type: "set_priority", priority: "high" });
    });

    it("should toggle isActive status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      // Deactivate
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        isActive: false,
      });

      let rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });
      expect(rule?.isActive).toBe(false);

      // Reactivate
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        isActive: true,
      });

      rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });
      expect(rule?.isActive).toBe(true);
    });

    it("should update only specified fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Original Name",
        description: "Original Description",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "medium" },
      });

      // Update only name
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        name: "New Name",
      });

      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule?.name).toBe("New Name");
      expect(rule?.description).toBe("Original Description"); // Unchanged
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, owner);
      const projectId = await createProjectInOrganization(t, owner, organizationId);

      // Add editor to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: editor,
          role: "member",
          addedBy: owner,
        });
      });

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const ruleId = await asOwner.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      // Editor tries to update - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);
      await expect(async () => {
        await asEditor.mutation(api.automationRules.update, {
          id: ruleId,
          name: "Hacked",
        });
      }).rejects.toThrow(/FORBIDDEN|admin/i);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      await expect(async () => {
        await t.mutation(api.automationRules.update, {
          id: ruleId,
          name: "Hacked",
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent rule", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a rule to get a valid but non-existent ID
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Temp Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(ruleId);
      });

      await expect(async () => {
        await asUser.mutation(api.automationRules.update, {
          id: ruleId,
          name: "Test",
        });
      }).rejects.toThrow("Rule not found");
    });
  });

  describe("remove", () => {
    it("should delete automation rule", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "To Delete",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      await asUser.mutation(api.automationRules.remove, { id: ruleId });

      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule).toBeNull();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, owner);
      const projectId = await createProjectInOrganization(t, owner, organizationId);

      // Add editor to organization
      await t.run(async (ctx) => {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId: editor,
          role: "member",
          addedBy: owner,
        });
      });

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const ruleId = await asOwner.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      // Editor tries to delete - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);
      await expect(async () => {
        await asEditor.mutation(api.automationRules.remove, { id: ruleId });
      }).rejects.toThrow(/FORBIDDEN|admin/i);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });

      await expect(async () => {
        await t.mutation(api.automationRules.remove, { id: ruleId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent rule", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a rule to get a valid but non-existent ID
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Temp Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "high" },
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(ruleId);
      });

      await expect(async () => {
        await asUser.mutation(api.automationRules.remove, { id: ruleId });
      }).rejects.toThrow("Rule not found");
    });
  });

  describe("executeRules (internal)", () => {
    it("should execute set_assignee action", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const assignee = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule to auto-assign
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-assign",
        trigger: "issue_created",
        actionType: "set_assignee",
        actionValue: { type: "set_assignee", assigneeId: assignee },
      });

      // Create issue
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      // Execute rules (internal mutation doesn't need auth)
      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId,
        trigger: "issue_created",
      });

      // Check if assignee was set
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.assigneeId).toBe(assignee);
    });

    it("should execute set_priority action", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule to set priority
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-prioritize",
        trigger: "issue_created",
        triggerValue: "bug",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "highest" },
      });

      // Create bug issue
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Bug Issue",
        type: "bug",
        priority: "medium",
      });

      // Execute rules (internal mutation doesn't need auth)
      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId,
        trigger: "issue_created",
        triggerValue: "bug",
      });

      // Check if priority was set
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.priority).toBe("highest");
    });

    it("should execute add_label action", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule to add label
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-label",
        trigger: "issue_created",
        actionType: "add_label",
        actionValue: { type: "add_label", label: "automated" },
      });

      // Create issue
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      // Execute rules (internal mutation doesn't need auth)
      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId,
        trigger: "issue_created",
      });

      // Check if label was added
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.labels.map((l) => l.name)).toContain("automated");
    });

    it("should execute add_comment action", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule to add comment
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Auto-comment",
        trigger: "issue_created",
        actionType: "add_comment",
        actionValue: { type: "add_comment", comment: "This issue was automatically created" },
      });

      // Create issue
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      // Execute rules (internal mutation doesn't need auth)
      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId,
        trigger: "issue_created",
      });

      // Check if comment was added
      const comments = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueComments")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });
      expect(comments).toHaveLength(1);
      expect(comments[0]?.content).toBe("This issue was automatically created");
    });

    it("should only execute active rules", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create inactive rule
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Inactive Rule",
        trigger: "issue_created",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "highest" },
      });

      // Deactivate rule
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        isActive: false,
      });

      // Create issue
      const { issueId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      // Execute rules (internal mutation doesn't need auth)
      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId,
        trigger: "issue_created",
      });

      // Priority should NOT be changed
      const issue = await asUser.query(api.issues.getIssue, { id: issueId });
      expect(issue?.priority).toBe("medium");
    });

    it("should increment execution count", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule
      const ruleId = await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Test Rule",
        trigger: "issue_created",
        actionType: "add_label",
        actionValue: { type: "add_label", label: "automated" },
      });

      // Create first issue
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });

      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId: issue1Id,
        trigger: "issue_created",
      });

      // Create second issue
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId: issue2Id,
        trigger: "issue_created",
      });

      // Check execution count
      const rule = await t.run(async (ctx) => {
        return await ctx.db.get(ruleId);
      });

      expect(rule?.executionCount).toBe(2);
    });

    it("should match trigger value when specified", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create rule that only triggers for bugs
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Bug Rule",
        trigger: "issue_created",
        triggerValue: "bug",
        actionType: "set_priority",
        actionValue: { type: "set_priority", priority: "highest" },
      });

      // Create task (should NOT trigger)
      const { issueId: taskId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Task",
        type: "task",
        priority: "medium",
      });

      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId: taskId,
        trigger: "issue_created",
        triggerValue: "task",
      });

      const task = await asUser.query(api.issues.getIssue, { id: taskId });
      expect(task?.priority).toBe("medium"); // Unchanged

      // Create bug (should trigger)
      const { issueId: bugId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Bug",
        type: "bug",
        priority: "medium",
      });

      await t.mutation(internal.automationRules.executeRules, {
        projectId,
        issueId: bugId,
        trigger: "issue_created",
        triggerValue: "bug",
      });

      const bug = await asUser.query(api.issues.getIssue, { id: bugId });
      expect(bug?.priority).toBe("highest"); // Changed
    });
  });
});
