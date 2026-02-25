import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("Issue Links", () => {
  describe("createIssueLink", () => {
    it("should create a link between two issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      const { linkId } = await asUser.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issue1Id,
        toIssueId: issue2Id,
        linkType: "blocks",
      });

      expect(linkId).toBeDefined();

      // Verify link exists
      const link = await t.run(async (ctx) => {
        return await ctx.db.get(linkId);
      });
      expect(link?.fromIssueId).toBe(issue1Id);
      expect(link?.toIssueId).toBe(issue2Id);
      expect(link?.linkType).toBe("blocks");

      // Verify activity log
      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issue1Id))
          .collect();
      });
      const linkActivity = activities.find((a) => a.action === "linked");
      expect(linkActivity).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should prevent duplicate links", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issue1Id,
        toIssueId: issue2Id,
        linkType: "blocks",
      });

      // Try to create same link again
      await expect(async () => {
        await asUser.mutation(api.issueLinks.createIssueLink, {
          fromIssueId: issue1Id,
          toIssueId: issue2Id,
          linkType: "blocks",
        });
      }).rejects.toThrow("Link already exists");
      await t.finishInProgressScheduledFunctions();
    });

    it("should require editor permissions", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const projectId = await createTestProject(t, adminId);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { issueId: issue1Id } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      // Add viewer to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, viewerId, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.issueLinks.createIssueLink, {
          fromIssueId: issue1Id,
          toIssueId: issue2Id,
          linkType: "blocks",
        });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("deleteIssueLink", () => {
    it("should remove an existing link", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issue1Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      const { linkId } = await asUser.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issue1Id,
        toIssueId: issue2Id,
        linkType: "relates",
      });

      const result = await asUser.mutation(api.issueLinks.deleteIssueLink, { linkId });
      expect(result).toEqual({ success: true, deleted: true });

      // Verify link is gone
      const link = await t.run(async (ctx) => {
        return await ctx.db.get(linkId);
      });
      expect(link).toBeNull();

      // Verify activity log
      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issue1Id))
          .collect();
      });
      const unlinkActivity = activities.find((a) => a.action === "unlinked");
      expect(unlinkActivity).toBeDefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should require editor permissions", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const projectId = await createTestProject(t, adminId);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      const asAdmin = asAuthenticatedUser(t, adminId);
      const { issueId: issue1Id } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const { issueId: issue2Id } = await asAdmin.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      const { linkId } = await asAdmin.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issue1Id,
        toIssueId: issue2Id,
        linkType: "relates",
      });

      // Add viewer to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, viewerId, adminId);
      await asAdmin.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.issueLinks.deleteIssueLink, { linkId });
      }).rejects.toThrow(/FORBIDDEN|editor/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("getIssueLinks", () => {
    it("should return incoming and outgoing links", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { issueId: issueAId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue A",
        type: "task",
        priority: "medium",
      });
      const { issueId: issueBId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue B",
        type: "task",
        priority: "medium",
      });
      const { issueId: issueCId } = await asUser.mutation(api.issues.createIssue, {
        projectId,
        title: "Issue C",
        type: "task",
        priority: "medium",
      });

      // A -> B (outgoing from A)
      await asUser.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issueAId,
        toIssueId: issueBId,
        linkType: "blocks",
      });

      // C -> A (incoming to A)
      await asUser.mutation(api.issueLinks.createIssueLink, {
        fromIssueId: issueCId,
        toIssueId: issueAId,
        linkType: "relates",
      });

      const { outgoing, incoming } = await asUser.query(api.issueLinks.getIssueLinks, {
        issueId: issueAId,
      });

      expect(outgoing).toHaveLength(1);
      expect(outgoing[0].linkType).toBe("blocks");
      expect(outgoing[0].issue?.title).toBe("Issue B");

      expect(incoming).toHaveLength(1);
      expect(incoming[0].linkType).toBe("relates");
      expect(incoming[0].issue?.title).toBe("Issue C");
      await t.finishInProgressScheduledFunctions();
    });
  });
});
