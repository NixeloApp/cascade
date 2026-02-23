import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Project Templates", () => {
  describe("list", () => {
    it("should return empty list when no templates exist", async () => {
      const t = convexTest(schema, modules);

      const templates = await t.query(api.projectTemplates.list, {});

      expect(templates).toEqual([]);
    });

    it("should return built-in templates after initialization", async () => {
      const t = convexTest(schema, modules);

      // Initialize templates
      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((tpl) => tpl.isBuiltIn === true)).toBe(true);
    });

    it("should include Software Development template", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});
      const softwareTpl = templates.find((tpl) => tpl.name === "Software Development");

      expect(softwareTpl).toBeDefined();
      expect(softwareTpl?.category).toBe("software");
      expect(softwareTpl?.boardType).toBe("scrum");
      expect(softwareTpl?.workflowStates.length).toBeGreaterThan(0);
      expect(softwareTpl?.defaultLabels.length).toBeGreaterThan(0);
    });

    it("should include Simple Kanban template", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});
      const kanbanTpl = templates.find((tpl) => tpl.name === "Simple Kanban");

      expect(kanbanTpl).toBeDefined();
      expect(kanbanTpl?.category).toBe("general");
      expect(kanbanTpl?.boardType).toBe("kanban");
    });

    it("should include Marketing Campaign template", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});
      const marketingTpl = templates.find((tpl) => tpl.name === "Marketing Campaign");

      expect(marketingTpl).toBeDefined();
      expect(marketingTpl?.category).toBe("marketing");
    });

    it("should include Design Project template", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});
      const designTpl = templates.find((tpl) => tpl.name === "Design Project");

      expect(designTpl).toBeDefined();
      expect(designTpl?.category).toBe("design");
    });
  });

  describe("get", () => {
    it("should return template by ID", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});
      const templateId = templates[0]._id;

      const template = await t.query(api.projectTemplates.get, { id: templateId });

      expect(template).not.toBeNull();
      expect(template?._id).toBe(templateId);
      expect(template?.name).toBe(templates[0].name);
    });

    it("should return null for non-existent template", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create and delete a template to get a valid but non-existent ID
      const templateId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("projectTemplates", {
          name: "Temp",
          description: "Temp",
          category: "temp",
          icon: "X",
          boardType: "kanban",
          workflowStates: [],
          defaultLabels: [],
          isBuiltIn: false,
        });
        await ctx.db.delete(id);
        return id;
      });

      const template = await t.query(api.projectTemplates.get, { id: templateId });

      expect(template).toBeNull();
    });
  });

  describe("initializeBuiltInTemplates", () => {
    it("should create all 4 built-in templates", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});

      expect(templates.length).toBe(4);
    });

    it("should be idempotent (no duplicates on second call)", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});

      expect(templates.length).toBe(4);
    });

    it("should create templates with proper workflow states", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});

      for (const template of templates) {
        expect(template.workflowStates.length).toBeGreaterThan(0);
        // Each workflow state should have required fields
        for (const state of template.workflowStates) {
          expect(state.id).toBeDefined();
          expect(state.name).toBeDefined();
          expect(state.category).toBeDefined();
          expect(["todo", "inprogress", "done"]).toContain(state.category);
        }
      }
    });

    it("should create templates with proper default labels", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});

      const templates = await t.query(api.projectTemplates.list, {});

      for (const template of templates) {
        expect(template.defaultLabels.length).toBeGreaterThan(0);
        // Each label should have name and color
        for (const label of template.defaultLabels) {
          expect(label.name).toBeDefined();
          expect(label.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      }
    });
  });

  describe("createFromTemplate", () => {
    it("should create project from template", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, asUser } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});
      const templateId = templates[0]._id;

      const { projectId } = await asUser.mutation(api.projectTemplates.createFromTemplate, {
        templateId,
        projectName: "My Project",
        projectKey: "MYPROJ",
        organizationId,
        workspaceId,
      });

      expect(projectId).toBeDefined();

      // Verify project was created
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.name).toBe("My Project");
      expect(project?.key).toBe("MYPROJ");
      expect(project?.boardType).toBe(templates[0].boardType);
    });

    it("should copy workflow states from template", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});
      const template = templates[0];

      const { projectId } = await asUser.mutation(api.projectTemplates.createFromTemplate, {
        templateId: template._id,
        projectName: "Workflow Test",
        projectKey: "WFT",
        organizationId,
        workspaceId,
      });

      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      expect(project?.workflowStates).toEqual(template.workflowStates);
    });

    it("should create labels from template", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});
      const template = templates[0];

      const { projectId } = await asUser.mutation(api.projectTemplates.createFromTemplate, {
        templateId: template._id,
        projectName: "Labels Test",
        projectKey: "LBL",
        organizationId,
        workspaceId,
      });

      // Check labels were created
      const labels = await t.run(async (ctx) =>
        ctx.db
          .query("labels")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect(),
      );

      expect(labels.length).toBe(template.defaultLabels.length);
      for (const templateLabel of template.defaultLabels) {
        const match = labels.find((l) => l.name === templateLabel.name);
        expect(match).toBeDefined();
        expect(match?.color).toBe(templateLabel.color);
      }
    });

    it("should add creator as admin member", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, workspaceId, asUser } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});

      const { projectId } = await asUser.mutation(api.projectTemplates.createFromTemplate, {
        templateId: templates[0]._id,
        projectName: "Member Test",
        projectKey: "MBR",
        organizationId,
        workspaceId,
      });

      const membership = await t.run(async (ctx) =>
        ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
          .first(),
      );

      expect(membership).not.toBeNull();
      expect(membership?.role).toBe("admin");
    });

    it("should reject non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      // Create and delete a template to get valid non-existent ID
      const templateId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("projectTemplates", {
          name: "Temp",
          description: "Temp",
          category: "temp",
          icon: "X",
          boardType: "kanban",
          workflowStates: [],
          defaultLabels: [],
          isBuiltIn: false,
        });
        await ctx.db.delete(id);
        return id;
      });

      await expect(
        asUser.mutation(api.projectTemplates.createFromTemplate, {
          templateId,
          projectName: "Test",
          projectKey: "TST",
          organizationId,
          workspaceId,
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("should reject duplicate project key", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId, asUser } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});

      // Create first project
      await asUser.mutation(api.projectTemplates.createFromTemplate, {
        templateId: templates[0]._id,
        projectName: "First Project",
        projectKey: "DUP",
        organizationId,
        workspaceId,
      });

      // Try to create second with same key
      await expect(
        asUser.mutation(api.projectTemplates.createFromTemplate, {
          templateId: templates[0]._id,
          projectName: "Second Project",
          projectKey: "DUP",
          organizationId,
          workspaceId,
        }),
      ).rejects.toThrow(/already exists/i);
    });

    it("should reject non-organization member", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId } = await createTestContext(t);
      const outsiderId = await createTestUser(t, { name: "Outsider", email: "outsider@test.com" });
      const asOutsider = asAuthenticatedUser(t, outsiderId);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});

      await expect(
        asOutsider.mutation(api.projectTemplates.createFromTemplate, {
          templateId: templates[0]._id,
          projectName: "Forbidden",
          projectKey: "FRB",
          organizationId,
          workspaceId,
        }),
      ).rejects.toThrow(/forbidden/i);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, workspaceId } = await createTestContext(t);

      await t.mutation(api.projectTemplates.initializeBuiltInTemplates, {});
      const templates = await t.query(api.projectTemplates.list, {});

      await expect(
        t.mutation(api.projectTemplates.createFromTemplate, {
          templateId: templates[0]._id,
          projectName: "Test",
          projectKey: "TST",
          organizationId,
          workspaceId,
        }),
      ).rejects.toThrow(/authenticated/i);
    });
  });
});
