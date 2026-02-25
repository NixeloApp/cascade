import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Issue Templates", () => {
  // Helper to create a context with a project
  async function createContextWithProject(t: ReturnType<typeof convexTest>) {
    const { userId, organizationId, asUser } = await createTestContext(t);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Template Test Project",
      key: "TTP",
    });
    return { userId, organizationId, projectId, asUser };
  }

  describe("create", () => {
    it("should create an issue template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Bug Report",
        type: "bug",
        titleTemplate: "[BUG] {{summary}}",
        descriptionTemplate: "## Steps to Reproduce\n\n## Expected Behavior\n\n## Actual Behavior",
        defaultPriority: "high",
        defaultLabels: ["bug", "needs-triage"],
      });

      expect(templateId).toBeDefined();

      const template = await asUser.query(api.templates.get, { id: templateId });
      expect(template?.name).toBe("Bug Report");
      expect(template?.type).toBe("bug");
      expect(template?.defaultPriority).toBe("high");
      expect(template?.defaultLabels).toEqual(["bug", "needs-triage"]);
    });

    it("should create template with all optional fields", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await createContextWithProject(t);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Story Template",
        type: "story",
        titleTemplate: "[STORY] {{title}}",
        descriptionTemplate: "## Description\n\n## Use Cases",
        defaultPriority: "medium",
        defaultLabels: ["enhancement"],
        defaultAssigneeId: userId,
        defaultStatus: "backlog",
        defaultStoryPoints: 3,
        isDefault: true,
      });

      const template = await asUser.query(api.templates.get, { id: templateId });
      expect(template?.defaultAssigneeId).toBe(userId);
      expect(template?.defaultStatus).toBe("backlog");
      expect(template?.defaultStoryPoints).toBe(3);
      expect(template?.isDefault).toBe(true);
    });

    it("should clear existing default when setting new default", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId: template1Id } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Template 1",
        type: "task",
        titleTemplate: "Task 1",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: true,
      });

      const { templateId: template2Id } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Template 2",
        type: "task",
        titleTemplate: "Task 2",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: true,
      });

      // Template 1 should no longer be default
      const template1 = await asUser.query(api.templates.get, { id: template1Id });
      const template2 = await asUser.query(api.templates.get, { id: template2Id });

      expect(template1?.isDefault).toBe(false);
      expect(template2?.isDefault).toBe(true);
    });

    it("should reject non-project members", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await createContextWithProject(t);
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      await expect(
        asOutsider.mutation(api.templates.create, {
          projectId,
          name: "Sneaky Template",
          type: "task",
          titleTemplate: "Task",
          descriptionTemplate: "",
          defaultPriority: "medium",
          defaultLabels: [],
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });

  describe("listByProject", () => {
    it("should list all templates for a project", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Bug Report",
        type: "bug",
        titleTemplate: "[BUG]",
        descriptionTemplate: "",
        defaultPriority: "high",
        defaultLabels: [],
      });

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Epic Template",
        type: "epic",
        titleTemplate: "[EPIC]",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      const templates = await asUser.query(api.templates.listByProject, { projectId });

      expect(templates.length).toBe(2);
    });

    it("should filter by type", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Bug Report",
        type: "bug",
        titleTemplate: "[BUG]",
        descriptionTemplate: "",
        defaultPriority: "high",
        defaultLabels: [],
      });

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Task Template",
        type: "task",
        titleTemplate: "[TASK]",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      const bugTemplates = await asUser.query(api.templates.listByProject, {
        projectId,
        type: "bug",
      });

      expect(bugTemplates.length).toBe(1);
      expect(bugTemplates[0].type).toBe("bug");
    });

    it("should return empty array for project with no templates", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const templates = await asUser.query(api.templates.listByProject, { projectId });

      expect(templates).toEqual([]);
    });
  });

  describe("getDefault", () => {
    it("should return default template for project", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Non-Default",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: false,
      });

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Default Template",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: true,
      });

      const defaultTemplate = await asUser.query(api.templates.getDefault, { projectId });

      expect(defaultTemplate?.name).toBe("Default Template");
    });

    it("should return null if no default template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      await asUser.mutation(api.templates.create, {
        projectId,
        name: "Non-Default",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: false,
      });

      const defaultTemplate = await asUser.query(api.templates.getDefault, { projectId });

      expect(defaultTemplate).toBeNull();
    });
  });

  describe("get", () => {
    it("should get template by ID", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Test Template",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "Description",
        defaultPriority: "medium",
        defaultLabels: ["test"],
      });

      const template = await asUser.query(api.templates.get, { id: templateId });

      expect(template?.name).toBe("Test Template");
      expect(template?.descriptionTemplate).toBe("Description");
    });

    it("should return null for non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      // Create and delete to get valid non-existent ID
      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Temp",
        type: "task",
        titleTemplate: "Temp",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });
      await asUser.mutation(api.templates.remove, { id: templateId });

      const template = await asUser.query(api.templates.get, { id: templateId });
      expect(template).toBeNull();
    });
  });

  describe("update", () => {
    it("should update template fields", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Original Name",
        type: "task",
        titleTemplate: "Original Title",
        descriptionTemplate: "Original Description",
        defaultPriority: "low",
        defaultLabels: [],
      });

      const result = await asUser.mutation(api.templates.update, {
        id: templateId,
        name: "Updated Name",
        titleTemplate: "Updated Title",
        defaultPriority: "high",
        defaultLabels: ["updated"],
      });
      expect(result).toEqual({ success: true });

      const template = await asUser.query(api.templates.get, { id: templateId });
      expect(template?.name).toBe("Updated Name");
      expect(template?.titleTemplate).toBe("Updated Title");
      expect(template?.defaultPriority).toBe("high");
      expect(template?.defaultLabels).toEqual(["updated"]);
    });

    it("should clear existing default when updating to default", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId: template1Id } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Template 1",
        type: "task",
        titleTemplate: "Task 1",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: true,
      });

      const { templateId: template2Id } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Template 2",
        type: "task",
        titleTemplate: "Task 2",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
        isDefault: false,
      });

      // Update template 2 to be default
      const result = await asUser.mutation(api.templates.update, {
        id: template2Id,
        isDefault: true,
      });
      expect(result).toEqual({ success: true });

      const template1 = await asUser.query(api.templates.get, { id: template1Id });
      const template2 = await asUser.query(api.templates.get, { id: template2Id });

      expect(template1?.isDefault).toBe(false);
      expect(template2?.isDefault).toBe(true);
    });

    it("should reject non-project members", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Protected Template",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      await expect(
        asOutsider.mutation(api.templates.update, {
          id: templateId,
          name: "Hijacked",
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });

    it("should reject updating non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      // Create and delete
      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Temp",
        type: "task",
        titleTemplate: "Temp",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });
      await asUser.mutation(api.templates.remove, { id: templateId });

      await expect(
        asUser.mutation(api.templates.update, {
          id: templateId,
          name: "Updated",
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("remove", () => {
    it("should delete template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "To Delete",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      const result = await asUser.mutation(api.templates.remove, { id: templateId });
      expect(result).toEqual({ success: true, deleted: true });

      const template = await asUser.query(api.templates.get, { id: templateId });
      expect(template).toBeNull();
    });

    it("should reject non-project members", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Protected Template",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      await expect(asOutsider.mutation(api.templates.remove, { id: templateId })).rejects.toThrow(
        /FORBIDDEN/i,
      );
    });

    it("should reject deleting non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      // Create and delete
      const { templateId } = await asUser.mutation(api.templates.create, {
        projectId,
        name: "Temp",
        type: "task",
        titleTemplate: "Temp",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });
      await asUser.mutation(api.templates.remove, { id: templateId });

      await expect(asUser.mutation(api.templates.remove, { id: templateId })).rejects.toThrow(
        /not found/i,
      );
    });
  });

  describe("issue types", () => {
    it("should support all issue types", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const issueTypes: Array<"epic" | "story" | "task" | "bug"> = ["epic", "story", "task", "bug"];

      for (const type of issueTypes) {
        const { templateId } = await asUser.mutation(api.templates.create, {
          projectId,
          name: `${type} Template`,
          type,
          titleTemplate: `[${type.toUpperCase()}]`,
          descriptionTemplate: "",
          defaultPriority: "medium",
          defaultLabels: [],
        });

        const template = await asUser.query(api.templates.get, { id: templateId });
        expect(template?.type).toBe(type);
      }
    });
  });

  describe("priority levels", () => {
    it("should support all priority levels", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await createContextWithProject(t);

      const priorities: Array<"lowest" | "low" | "medium" | "high" | "highest"> = [
        "lowest",
        "low",
        "medium",
        "high",
        "highest",
      ];

      for (const priority of priorities) {
        const { templateId } = await asUser.mutation(api.templates.create, {
          projectId,
          name: `${priority} Priority Template`,
          type: "task",
          titleTemplate: "Task",
          descriptionTemplate: "",
          defaultPriority: priority,
          defaultLabels: [],
        });

        const template = await asUser.query(api.templates.get, { id: templateId });
        expect(template?.defaultPriority).toBe(priority);
      }
    });
  });

  describe("project member access", () => {
    it("should allow editor to create templates", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await createContextWithProject(t);

      // Add an editor
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
      await addProjectMember(t, projectId, editorId, "editor", userId);
      const asEditor = asAuthenticatedUser(t, editorId);

      const { templateId } = await asEditor.mutation(api.templates.create, {
        projectId,
        name: "Editor Template",
        type: "task",
        titleTemplate: "Task",
        descriptionTemplate: "",
        defaultPriority: "medium",
        defaultLabels: [],
      });

      expect(templateId).toBeDefined();
    });

    it("should reject viewer from creating templates", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId } = await createContextWithProject(t);

      // Add a viewer
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      await expect(
        asViewer.mutation(api.templates.create, {
          projectId,
          name: "Viewer Template",
          type: "task",
          titleTemplate: "Task",
          descriptionTemplate: "",
          defaultPriority: "medium",
          defaultLabels: [],
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });
});
