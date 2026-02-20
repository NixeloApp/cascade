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

describe("Export", () => {
  describe("exportIssuesCSV", () => {
    it("should export issues as CSV format", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Export Test Project",
        key: "EXP",
      });

      // Create test issues
      await createTestIssue(t, projectId, userId, {
        title: "Test Issue 1",
        type: "bug",
        priority: "high",
      });
      await createTestIssue(t, projectId, userId, {
        title: "Test Issue 2",
        type: "task",
        priority: "medium",
      });

      const csv = await asUser.query(api.export.exportIssuesCSV, { projectId });

      expect(typeof csv).toBe("string");
      expect(csv).toContain("Key,Title,Type,Status,Priority");
      expect(csv).toContain("EXP-1");
      expect(csv).toContain("EXP-2");
      expect(csv).toContain("Test Issue 1");
      expect(csv).toContain("Test Issue 2");
    });

    it("should filter by sprint when sprintId provided", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Sprint Export Project",
        key: "SPR",
      });

      // Create a sprint
      const sprintId = await t.run(async (ctx) => {
        return await ctx.db.insert("sprints", {
          projectId,
          name: "Sprint 1",
          status: "active",
          startDate: Date.now(),
          endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
          createdBy: userId,
          updatedAt: Date.now(),
        });
      });

      // Create issues - one in sprint, one without
      await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "SPR-1",
          title: "In Sprint",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          sprintId,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          updatedAt: Date.now(),
        });

        await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "SPR-2",
          title: "No Sprint",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 1,
          updatedAt: Date.now(),
        });
      });

      const csv = await asUser.query(api.export.exportIssuesCSV, { projectId, sprintId });

      expect(csv).toContain("In Sprint");
      expect(csv).not.toContain("No Sprint");
    });

    it("should filter by status when status provided", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Status Export Project",
        key: "STA",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Todo Issue",
        status: "todo",
      });
      await createTestIssue(t, projectId, userId, {
        title: "Done Issue",
        status: "done",
      });

      const csv = await asUser.query(api.export.exportIssuesCSV, {
        projectId,
        status: "done",
      });

      expect(csv).toContain("Done Issue");
      expect(csv).not.toContain("Todo Issue");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Auth Test",
        key: "AUTH",
      });

      await expect(t.query(api.export.exportIssuesCSV, { projectId })).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("exportIssuesJSON", () => {
    it("should export issues as JSON format", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "JSON Export Project",
        key: "JSON",
      });

      await createTestIssue(t, projectId, userId, {
        title: "JSON Test Issue",
        type: "story",
        priority: "highest",
      });

      const jsonString = await asUser.query(api.export.exportIssuesJSON, { projectId });
      const data = JSON.parse(jsonString);

      expect(data.project.name).toBe("JSON Export Project");
      expect(data.project.key).toBe("JSON");
      expect(data.totalIssues).toBe(1);
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].title).toBe("JSON Test Issue");
      expect(data.exportedAt).toBeDefined();
    });

    it("should include enriched data in JSON export", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Enriched Export",
        key: "ENR",
      });

      await createTestIssue(t, projectId, userId, {
        title: "Enriched Issue",
        assigneeId: userId,
      });

      const jsonString = await asUser.query(api.export.exportIssuesJSON, { projectId });
      const data = JSON.parse(jsonString);

      expect(data.issues[0].assigneeName).toBeDefined();
      expect(data.issues[0].reporterName).toBeDefined();
      expect(data.issues[0].statusName).toBeDefined();
    });
  });

  describe("exportAnalytics", () => {
    it("should export analytics data for project", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Analytics Export",
        key: "ANA",
      });

      // Create various issues
      await createTestIssue(t, projectId, userId, { type: "bug", priority: "high" });
      await createTestIssue(t, projectId, userId, { type: "bug", priority: "medium" });
      await createTestIssue(t, projectId, userId, { type: "task", priority: "low" });

      const analytics = await asUser.query(api.export.exportAnalytics, { projectId });

      expect(analytics.projectName).toBe("Analytics Export");
      expect(analytics.projectKey).toBe("ANA");
      expect(analytics.totalIssues).toBe(3);
      expect(analytics.issuesByType.bug).toBe(2);
      expect(analytics.issuesByType.task).toBe(1);
      expect(analytics.issuesByPriority.high).toBe(1);
      expect(analytics.issuesByPriority.medium).toBe(1);
      expect(analytics.issuesByPriority.low).toBe(1);
      expect(analytics.exportedAt).toBeDefined();
    });

    it("should calculate completion rate", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Completion Rate Test",
        key: "CRT",
      });

      // Create 4 issues, 1 done
      await createTestIssue(t, projectId, userId, { status: "todo" });
      await createTestIssue(t, projectId, userId, { status: "todo" });
      await createTestIssue(t, projectId, userId, { status: "inprogress" });
      await createTestIssue(t, projectId, userId, { status: "done" });

      const analytics = await asUser.query(api.export.exportAnalytics, { projectId });

      expect(analytics.totalIssues).toBe(4);
      expect(analytics.completedIssues).toBe(1);
      expect(analytics.completionRate).toBe(25);
    });
  });

  describe("importIssuesJSON", () => {
    it("should import issues from valid JSON", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Import Test",
        key: "IMP",
      });

      const jsonData = JSON.stringify({
        issues: [
          { title: "Imported Issue 1", type: "task", priority: "high" },
          { title: "Imported Issue 2", type: "bug", priority: "low" },
        ],
      });

      const result = await asUser.mutation(api.export.importIssuesJSON, {
        projectId,
        jsonData,
      });

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should handle import errors gracefully", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Error Import Test",
        key: "ERR",
      });

      const jsonData = JSON.stringify({
        issues: [
          { title: "Valid Issue" },
          { description: "Missing title" }, // Invalid - no title
        ],
      });

      const result = await asUser.mutation(api.export.importIssuesJSON, {
        projectId,
        jsonData,
      });

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it("should reject invalid JSON format", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Invalid JSON Test",
        key: "INV",
      });

      await expect(
        asUser.mutation(api.export.importIssuesJSON, {
          projectId,
          jsonData: "not valid json",
        }),
      ).rejects.toThrow(/Invalid JSON/i);
    });

    it("should reject JSON without issues array", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "No Issues Array Test",
        key: "NIA",
      });

      await expect(
        asUser.mutation(api.export.importIssuesJSON, {
          projectId,
          jsonData: JSON.stringify({ data: [] }),
        }),
      ).rejects.toThrow(/issues.*array/i);
    });

    it("should reject non-editor users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Editor Test",
        key: "EDT",
      });

      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const asViewer = asAuthenticatedUser(t, viewerId);

      // Add viewer as viewer role (not editor)
      await t.run(async (ctx) => {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: viewerId,
          role: "viewer",
          addedBy: userId,
        });
      });

      await expect(
        asViewer.mutation(api.export.importIssuesJSON, {
          projectId,
          jsonData: JSON.stringify({ issues: [{ title: "Test" }] }),
        }),
      ).rejects.toThrow(/FORBIDDEN|editor/i);
    });
  });

  describe("importIssuesCSV", () => {
    it("should import issues from valid CSV", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "CSV Import Test",
        key: "CSV",
      });

      const csvData = `title,type,priority,description
First CSV Issue,task,high,Description 1
Second CSV Issue,bug,medium,Description 2`;

      const result = await asUser.mutation(api.export.importIssuesCSV, {
        projectId,
        csvData,
      });

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should reject CSV without title column", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "No Title CSV Test",
        key: "NTC",
      });

      const csvData = `type,priority
task,high`;

      await expect(
        asUser.mutation(api.export.importIssuesCSV, {
          projectId,
          csvData,
        }),
      ).rejects.toThrow(/title.*column/i);
    });

    it("should reject CSV with only header row", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Header Only Test",
        key: "HOT",
      });

      const csvData = "title,type,priority";

      await expect(
        asUser.mutation(api.export.importIssuesCSV, {
          projectId,
          csvData,
        }),
      ).rejects.toThrow(/at least.*header.*data/i);
    });
  });
});
