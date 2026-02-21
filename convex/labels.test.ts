import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Labels", () => {
  describe("create", () => {
    it("should create a label", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const labelId = await asUser.mutation(api.labels.create, {
        projectId,
        name: "Bug",
        color: "#EF4444",
      });

      expect(labelId).toBeDefined();

      const labels = await asUser.query(api.labels.list, { projectId });
      expect(labels).toHaveLength(1);
      expect(labels[0].name).toBe("Bug");
      expect(labels[0].color).toBe("#EF4444");
    });

    it("should prevent duplicate label names in same project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.labels.create, {
        projectId,
        name: "Feature",
        color: "#3B82F6",
      });

      await expect(async () => {
        await asUser.mutation(api.labels.create, {
          projectId,
          name: "Feature",
          color: "#10B981",
        });
      }).rejects.toThrow("already exists");
    });
  });

  describe("list", () => {
    it("should list all labels in a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.labels.create, {
        projectId,
        name: "Bug",
        color: "#EF4444",
      });
      await asUser.mutation(api.labels.create, {
        projectId,
        name: "Feature",
        color: "#3B82F6",
      });
      await asUser.mutation(api.labels.create, {
        projectId,
        name: "Enhancement",
        color: "#10B981",
      });

      const labels = await asUser.query(api.labels.list, { projectId });
      expect(labels).toHaveLength(3);
      expect(labels.map((l) => l.name)).toContain("Bug");
      expect(labels.map((l) => l.name)).toContain("Feature");
      expect(labels.map((l) => l.name)).toContain("Enhancement");
    });
  });

  describe("update", () => {
    it("should update label name", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const labelId = await asUser.mutation(api.labels.create, {
        projectId,
        name: "Old Name",
        color: "#EF4444",
      });

      await asUser.mutation(api.labels.update, {
        id: labelId,
        name: "New Name",
      });

      const labels = await asUser.query(api.labels.list, { projectId });
      expect(labels[0].name).toBe("New Name");
    });

    it("should update label color", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const labelId = await asUser.mutation(api.labels.create, {
        projectId,
        name: "Label",
        color: "#EF4444",
      });

      await asUser.mutation(api.labels.update, {
        id: labelId,
        color: "#3B82F6",
      });

      const labels = await asUser.query(api.labels.list, { projectId });
      expect(labels[0].color).toBe("#3B82F6");
    });

    it("should prevent renaming to existing label name", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.labels.create, {
        projectId,
        name: "Label A",
        color: "#EF4444",
      });
      const labelBId = await asUser.mutation(api.labels.create, {
        projectId,
        name: "Label B",
        color: "#3B82F6",
      });

      await expect(async () => {
        await asUser.mutation(api.labels.update, {
          id: labelBId,
          name: "Label A",
        });
      }).rejects.toThrow("already exists");
    });
  });

  describe("remove", () => {
    it("should delete a label", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const labelId = await asUser.mutation(api.labels.create, {
        projectId,
        name: "To Delete",
        color: "#EF4444",
      });

      await asUser.mutation(api.labels.remove, { id: labelId });

      const labels = await asUser.query(api.labels.list, { projectId });
      expect(labels).toHaveLength(0);
    });
  });
});
