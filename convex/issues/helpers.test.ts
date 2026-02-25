import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestIssue, createTestProject, createTestUser } from "../testUtils";
import {
  fetchIssuesWithProjects,
  generateIssueKey,
  getMaxOrderForStatus,
  getSearchContent,
  matchesArrayFilter,
  matchesAssigneeFilter,
  matchesDateRange,
  matchesEpicFilter,
  matchesLabelsFilter,
  matchesSearchFilters,
  matchesSprintFilter,
  processIssueUpdates,
  trackFieldChange,
  trackNullableFieldUpdate,
  validateParentIssue,
} from "./helpers";

describe("issue helpers", () => {
  describe("getSearchContent", () => {
    it("should combine title and description", () => {
      expect(getSearchContent("Title", "Description")).toBe("Title Description");
    });

    it("should handle empty description", () => {
      expect(getSearchContent("Title", "")).toBe("Title");
      expect(getSearchContent("Title", undefined)).toBe("Title");
    });

    it("should trim whitespace", () => {
      expect(getSearchContent("Title", "")).toBe("Title");
    });
  });

  describe("trackFieldChange", () => {
    it("should track when value changes", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackFieldChange(updates, changes, "title", "Old Title", "New Title");

      expect(updates.title).toBe("New Title");
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: "title",
        oldValue: "Old Title",
        newValue: "New Title",
      });
    });

    it("should not track when value is same", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackFieldChange(updates, changes, "title", "Same", "Same");

      expect(updates.title).toBeUndefined();
      expect(changes).toHaveLength(0);
    });

    it("should not track when newValue is undefined", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackFieldChange(updates, changes, "title", "Old", undefined);

      expect(updates.title).toBeUndefined();
      expect(changes).toHaveLength(0);
    });
  });

  describe("trackNullableFieldUpdate", () => {
    it("should track update to new value", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackNullableFieldUpdate(updates, changes, "assigneeId", "old-id", "new-id");

      expect(updates.assigneeId).toBe("new-id");
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBe("new-id");
    });

    it("should track update to null (clearing field)", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackNullableFieldUpdate(updates, changes, "assigneeId", "old-id", null);

      expect(updates.assigneeId).toBeUndefined(); // null becomes undefined
      expect(changes).toHaveLength(1);
      expect(changes[0].newValue).toBeNull();
    });

    it("should not track when newValue is undefined", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackNullableFieldUpdate(updates, changes, "assigneeId", "old-id", undefined);

      expect(updates.assigneeId).toBeUndefined();
      expect(changes).toHaveLength(0);
    });

    it("should apply value transform", () => {
      const updates: Record<string, unknown> = {};
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      trackNullableFieldUpdate(updates, changes, "dueDate", 1000, 2000, (val) =>
        val ? `Date: ${val}` : null,
      );

      expect(changes[0].oldValue).toBe("Date: 1000");
      expect(changes[0].newValue).toBe("Date: 2000");
    });
  });

  describe("processIssueUpdates", () => {
    it("should process multiple field updates", () => {
      const issue = {
        title: "Old Title",
        description: "Old Description",
        priority: "low" as const,
        assigneeId: undefined,
        labels: [],
        dueDate: undefined,
        estimatedHours: undefined,
        storyPoints: undefined,
      };

      const args = {
        title: "New Title",
        priority: "high" as const,
      };

      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      const updates = processIssueUpdates(issue, args, changes);

      expect(updates.title).toBe("New Title");
      expect(updates.priority).toBe("high");
      expect(updates.searchContent).toBe("New Title Old Description");
      expect(changes).toHaveLength(2);
    });

    it("should update searchContent when description changes", () => {
      const issue = {
        title: "Title",
        description: "Old Desc",
        priority: "medium" as const,
        assigneeId: undefined,
        labels: [],
        dueDate: undefined,
        estimatedHours: undefined,
        storyPoints: undefined,
      };

      const args = { description: "New Desc" };
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      const updates = processIssueUpdates(issue, args, changes);

      expect(updates.searchContent).toBe("Title New Desc");
    });

    it("should handle labels update", () => {
      const issue = {
        title: "Title",
        description: undefined,
        priority: "medium" as const,
        assigneeId: undefined,
        labels: ["bug"],
        dueDate: undefined,
        estimatedHours: undefined,
        storyPoints: undefined,
      };

      const args = { labels: ["bug", "frontend"] };
      const changes: Array<{
        field: string;
        oldValue: string | number | null | undefined;
        newValue: string | number | null | undefined;
      }> = [];

      const updates = processIssueUpdates(issue, args, changes);

      expect(updates.labels).toEqual(["bug", "frontend"]);
      expect(changes.find((c) => c.field === "labels")).toBeDefined();
    });
  });

  describe("matchesAssigneeFilter", () => {
    const userId = "user123" as Id<"users">;
    const otherId = "other456" as Id<"users">;

    it("should return true when no filter", () => {
      expect(matchesAssigneeFilter({ assigneeId: userId }, undefined, userId)).toBe(true);
    });

    it("should match 'unassigned' filter", () => {
      expect(matchesAssigneeFilter({ assigneeId: undefined }, "unassigned", userId)).toBe(true);
      expect(matchesAssigneeFilter({ assigneeId: userId }, "unassigned", userId)).toBe(false);
    });

    it("should match 'me' filter", () => {
      expect(matchesAssigneeFilter({ assigneeId: userId }, "me", userId)).toBe(true);
      expect(matchesAssigneeFilter({ assigneeId: otherId }, "me", userId)).toBe(false);
    });

    it("should match specific user ID", () => {
      expect(matchesAssigneeFilter({ assigneeId: userId }, userId, userId)).toBe(true);
      expect(matchesAssigneeFilter({ assigneeId: otherId }, userId, userId)).toBe(false);
    });
  });

  describe("matchesSprintFilter", () => {
    const sprintId = "sprint123" as Id<"sprints">;
    const otherSprintId = "sprint456" as Id<"sprints">;

    it("should return true when no filter", () => {
      expect(matchesSprintFilter({ sprintId }, undefined)).toBe(true);
    });

    it("should match 'backlog' filter", () => {
      expect(matchesSprintFilter({ sprintId: undefined }, "backlog")).toBe(true);
      expect(matchesSprintFilter({ sprintId }, "backlog")).toBe(false);
    });

    it("should match 'none' filter", () => {
      expect(matchesSprintFilter({ sprintId: undefined }, "none")).toBe(true);
      expect(matchesSprintFilter({ sprintId }, "none")).toBe(false);
    });

    it("should match specific sprint ID", () => {
      expect(matchesSprintFilter({ sprintId }, sprintId)).toBe(true);
      expect(matchesSprintFilter({ sprintId: otherSprintId }, sprintId)).toBe(false);
    });
  });

  describe("matchesEpicFilter", () => {
    const epicId = "epic123" as Id<"issues">;
    const otherEpicId = "epic456" as Id<"issues">;

    it("should return true when no filter", () => {
      expect(matchesEpicFilter({ epicId }, undefined)).toBe(true);
    });

    it("should match 'none' filter", () => {
      expect(matchesEpicFilter({ epicId: undefined }, "none")).toBe(true);
      expect(matchesEpicFilter({ epicId }, "none")).toBe(false);
    });

    it("should match specific epic ID", () => {
      expect(matchesEpicFilter({ epicId }, epicId)).toBe(true);
      expect(matchesEpicFilter({ epicId: otherEpicId }, epicId)).toBe(false);
    });
  });

  describe("matchesArrayFilter", () => {
    it("should return true when no filter", () => {
      expect(matchesArrayFilter("task", undefined)).toBe(true);
      expect(matchesArrayFilter("task", [])).toBe(true);
    });

    it("should match when value is in filter array", () => {
      expect(matchesArrayFilter("task", ["task", "bug"])).toBe(true);
      expect(matchesArrayFilter("bug", ["task", "bug"])).toBe(true);
    });

    it("should not match when value is not in filter array", () => {
      expect(matchesArrayFilter("story", ["task", "bug"])).toBe(false);
    });
  });

  describe("matchesDateRange", () => {
    const now = Date.now();
    const yesterday = now - DAY;
    const tomorrow = now + DAY;

    it("should return true when no date filters", () => {
      expect(matchesDateRange(now, undefined, undefined)).toBe(true);
    });

    it("should filter by dateFrom", () => {
      expect(matchesDateRange(now, yesterday, undefined)).toBe(true);
      expect(matchesDateRange(yesterday, now, undefined)).toBe(false);
    });

    it("should filter by dateTo", () => {
      expect(matchesDateRange(now, undefined, tomorrow)).toBe(true);
      expect(matchesDateRange(tomorrow, undefined, now)).toBe(false);
    });

    it("should filter by both dateFrom and dateTo", () => {
      expect(matchesDateRange(now, yesterday, tomorrow)).toBe(true);
      expect(matchesDateRange(yesterday - 1, yesterday, tomorrow)).toBe(false);
      expect(matchesDateRange(tomorrow + 1, yesterday, tomorrow)).toBe(false);
    });
  });

  describe("matchesLabelsFilter", () => {
    it("should return true when no filter", () => {
      expect(matchesLabelsFilter(["bug"], undefined)).toBe(true);
      expect(matchesLabelsFilter(["bug"], [])).toBe(true);
    });

    it("should match when all filter labels are present", () => {
      expect(matchesLabelsFilter(["bug", "frontend", "urgent"], ["bug", "frontend"])).toBe(true);
    });

    it("should not match when some filter labels are missing", () => {
      expect(matchesLabelsFilter(["bug"], ["bug", "frontend"])).toBe(false);
    });

    it("should not match empty labels against filter", () => {
      expect(matchesLabelsFilter([], ["bug"])).toBe(false);
    });
  });

  describe("matchesSearchFilters", () => {
    const userId = "user123" as Id<"users">;
    const projectId = "project123" as Id<"projects">;

    const baseIssue = {
      projectId,
      assigneeId: userId,
      reporterId: userId,
      type: "task",
      status: "todo",
      priority: "medium",
      labels: ["bug"],
      sprintId: undefined,
      epicId: undefined,
      _creationTime: Date.now(),
    };

    it("should return true when no filters", () => {
      expect(matchesSearchFilters(baseIssue, {}, userId)).toBe(true);
    });

    it("should filter by projectId", () => {
      expect(matchesSearchFilters(baseIssue, { projectId }, userId)).toBe(true);
      expect(
        matchesSearchFilters(baseIssue, { projectId: "other" as Id<"projects"> }, userId),
      ).toBe(false);
    });

    it("should filter by type array", () => {
      expect(matchesSearchFilters(baseIssue, { type: ["task", "bug"] }, userId)).toBe(true);
      expect(matchesSearchFilters(baseIssue, { type: ["bug", "story"] }, userId)).toBe(false);
    });

    it("should filter by status array", () => {
      expect(matchesSearchFilters(baseIssue, { status: ["todo", "inprogress"] }, userId)).toBe(
        true,
      );
      expect(matchesSearchFilters(baseIssue, { status: ["done"] }, userId)).toBe(false);
    });

    it("should filter by priority array", () => {
      expect(matchesSearchFilters(baseIssue, { priority: ["medium", "high"] }, userId)).toBe(true);
      expect(matchesSearchFilters(baseIssue, { priority: ["low"] }, userId)).toBe(false);
    });

    it("should combine multiple filters", () => {
      expect(
        matchesSearchFilters(
          baseIssue,
          {
            projectId,
            type: ["task"],
            status: ["todo"],
            assigneeId: "me",
          },
          userId,
        ),
      ).toBe(true);

      expect(
        matchesSearchFilters(
          baseIssue,
          {
            projectId,
            type: ["bug"], // doesn't match
            status: ["todo"],
          },
          userId,
        ),
      ).toBe(false);
    });
  });

  describe("validateParentIssue (integration)", () => {
    it("should return epicId when no parent", async () => {
      const t = convexTest(schema, modules);
      const epicId = "epic123" as Id<"issues">;

      const result = await t.run(async (ctx) => {
        return await validateParentIssue(ctx, undefined, "task", epicId);
      });

      expect(result).toBe(epicId);
    });

    it("should throw for non-existent parent", async () => {
      const t = convexTest(schema, modules);
      const fakeParentId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"issues">;

      await expect(
        t.run(async (ctx) => {
          return await validateParentIssue(ctx, fakeParentId, "subtask", undefined);
        }),
      ).rejects.toThrow();
    });

    it("should throw for sub-task of sub-task", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Create parent issue
      const parentId = await createTestIssue(t, projectId, userId, { type: "task" });

      // Create first sub-task
      const subTaskId = await t.run(async (ctx) => {
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        return await ctx.db.insert("issues", {
          projectId,
          organizationId: project.organizationId,
          workspaceId: project.workspaceId,
          key: "TEST-2",
          title: "Subtask",
          type: "subtask",
          status: "todo",
          priority: "medium",
          reporterId: userId,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: 0,
          updatedAt: Date.now(),
          parentId, // This is a subtask
        });
      });

      // Try to create sub-task of sub-task
      await expect(
        t.run(async (ctx) => {
          return await validateParentIssue(ctx, subTaskId, "subtask", undefined);
        }),
      ).rejects.toThrow(/one level deep/);
    });

    it("should throw for non-subtask type with parent", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const parentId = await createTestIssue(t, projectId, userId, { type: "task" });

      await expect(
        t.run(async (ctx) => {
          return await validateParentIssue(ctx, parentId, "task", undefined); // Should be 'subtask'
        }),
      ).rejects.toThrow(/must be of type 'subtask'/);
    });
  });

  describe("generateIssueKey (integration)", () => {
    it("should generate first issue key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, { key: "KEYTEST" });

      const key = await t.run(async (ctx) => {
        return await generateIssueKey(ctx, projectId, "KEYTEST");
      });

      expect(key).toBe("KEYTEST-1");
    });

    it("should increment issue number", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, { key: "INC" });

      // Create first issue
      await createTestIssue(t, projectId, userId);

      const key = await t.run(async (ctx) => {
        return await generateIssueKey(ctx, projectId, "INC");
      });

      expect(key).toBe("INC-2");
    });
  });

  describe("getMaxOrderForStatus (integration)", () => {
    it("should return -1 for empty status column", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const maxOrder = await t.run(async (ctx) => {
        return await getMaxOrderForStatus(ctx, projectId, "empty_status");
      });

      expect(maxOrder).toBe(-1);
    });

    it("should return max order from existing issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      // Create issues with different orders
      await createTestIssue(t, projectId, userId); // order 0
      await createTestIssue(t, projectId, userId); // order 1

      const maxOrder = await t.run(async (ctx) => {
        return await getMaxOrderForStatus(ctx, projectId, "todo");
      });

      expect(maxOrder).toBe(1);
    });
  });

  describe("fetchIssuesWithProjects (integration)", () => {
    it("should fetch issues and projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const issueId = await createTestIssue(t, projectId, userId);

      const result = await t.run(async (ctx) => {
        const { issues, projectMap } = await fetchIssuesWithProjects(ctx, [issueId]);
        // Convert Map to object for Convex serialization
        return { issues, projects: Object.fromEntries(projectMap) };
      });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]._id).toBe(issueId);
      expect(result.projects[projectId.toString()]).toBeDefined();
    });

    it("should handle missing issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);
      const issueId = await createTestIssue(t, projectId, userId);
      const fakeIssueId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"issues">;

      const result = await t.run(async (ctx) => {
        const { issues, projectMap } = await fetchIssuesWithProjects(ctx, [issueId, fakeIssueId]);
        // Convert Map to object for Convex serialization
        return { issues, projects: Object.fromEntries(projectMap) };
      });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]._id).toBe(issueId);
      expect(result.projects[projectId.toString()]).toBeDefined();
    });
  });
});
