import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { enrichIssues } from "../lib/issueHelpers";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestProject,
  createTestUser,
} from "../testUtils";

describe("Label Enrichment", () => {
  describe("Performance & Limits", () => {
    it("should correctly enrich issues with labels > 200th position", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);
      const projectId = await createProjectInOrganization(t, userId, organizationId);

      // Create 250 labels
      await t.run(async (ctx) => {
        const labels = Array.from({ length: 250 }, (_, i) => ({
          projectId,
          name: `label-${i}`,
          color: "#000000",
          createdBy: userId,
        }));
        for (const label of labels) {
          await ctx.db.insert("labels", label);
        }
      });

      // Create an issue using the 240th label
      const issueId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          teamId: project.teamId,
          key: "TEST-1",
          title: "Test Issue",
          type: "task",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          labels: ["label-240"],
          searchContent: "Test Issue",
          updatedAt: Date.now(),
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
        });
      });

      // Verify enrichment
      const enriched = await t.run(async (ctx) => {
        const issue = await ctx.db.get(issueId);
        if (!issue) throw new Error("Issue not found");
        return await enrichIssues(ctx, [issue]);
      });

      expect(enriched[0].labels).toHaveLength(1);
      expect(enriched[0].labels[0].name).toBe("label-240");
      // With current bug, color might be default gray if not found
      // If found, it should be #000000.
      expect(enriched[0].labels[0].color).toBe("#000000");
    });
  });

  describe("API Integration", () => {
    it("should enrich issue with labels even if project has >100 labels", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      // Insert 105 labels
      const label104Id = await t.run(async (ctx) => {
        let lastId: string | undefined;
        for (let i = 0; i < 105; i++) {
          const id = await ctx.db.insert("labels", {
            projectId,
            name: `Label ${i}`,
            color: "#123456", // specific color
            createdBy: userId,
          });
          if (i === 104) lastId = id;
        }
        return lastId;
      });

      if (!label104Id) throw new Error("Label 104 not created");

      // Create an issue using the last label (which would be missing with take(100))
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
        labels: [label104Id as Id<"labels">],
      });

      // Get the issue
      const issue = await asUser.query(api.issues.get, { id: issueId });

      if (!issue) throw new Error("Issue not found");

      expect(issue.labels).toHaveLength(1);
      expect(issue.labels[0].name).toBe("Label 104");

      // This is the assertion that should fail if the bug exists
      expect(issue.labels[0].color).toBe("#123456");
    });
  });
});
