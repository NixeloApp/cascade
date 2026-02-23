/**
 * Tests for Modules functionality
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Modules", () => {
  describe("create", () => {
    it("should create a module", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "User Authentication",
        description: "Auth related features",
      });

      expect(moduleId).toBeDefined();
    });

    it("should create a module with dates", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const startDate = Date.now();
      const targetDate = startDate + 7 * 24 * 60 * 60 * 1000; // 7 days later

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "Sprint Feature",
        startDate,
        targetDate,
      });

      expect(moduleId).toBeDefined();

      const module = await asUser.query(api.modules.get, { projectId, moduleId });
      expect(module?.startDate).toBe(startDate);
      expect(module?.targetDate).toBe(targetDate);
    });
  });

  describe("listByProject", () => {
    it("should list all modules in a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.modules.create, {
        projectId,
        name: "Module A",
      });
      await asUser.mutation(api.modules.create, {
        projectId,
        name: "Module B",
      });
      await asUser.mutation(api.modules.create, {
        projectId,
        name: "Module C",
      });

      const modulesList = await asUser.query(api.modules.listByProject, { projectId });
      expect(modulesList).toHaveLength(3);
      expect(modulesList.map((m) => m.name)).toContain("Module A");
      expect(modulesList.map((m) => m.name)).toContain("Module B");
      expect(modulesList.map((m) => m.name)).toContain("Module C");
    });

    it("should filter modules by status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId: moduleId1 } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "In Progress Module",
      });
      await asUser.mutation(api.modules.create, {
        projectId,
        name: "Backlog Module",
      });

      // Update first module to in_progress
      await asUser.mutation(api.modules.update, {
        projectId,
        moduleId: moduleId1,
        status: "in_progress",
      });

      const inProgressModules = await asUser.query(api.modules.listByProject, {
        projectId,
        status: "in_progress",
      });
      expect(inProgressModules).toHaveLength(1);
      expect(inProgressModules[0].name).toBe("In Progress Module");
    });
  });

  describe("update", () => {
    it("should update module name", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "Old Name",
      });

      await asUser.mutation(api.modules.update, {
        projectId,
        moduleId,
        name: "New Name",
      });

      const module = await asUser.query(api.modules.get, { projectId, moduleId });
      expect(module?.name).toBe("New Name");
    });

    it("should update module status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "Test Module",
      });

      await asUser.mutation(api.modules.update, {
        projectId,
        moduleId,
        status: "completed",
      });

      const module = await asUser.query(api.modules.get, { projectId, moduleId });
      expect(module?.status).toBe("completed");
    });
  });

  describe("remove", () => {
    it("should soft delete a module", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { moduleId } = await asUser.mutation(api.modules.create, {
        projectId,
        name: "To Delete",
      });

      await asUser.mutation(api.modules.remove, { projectId, moduleId });

      const modulesList = await asUser.query(api.modules.listByProject, { projectId });
      expect(modulesList).toHaveLength(0);
    });
  });
});
