import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Label Groups", () => {
  describe("createLabelGroup", () => {
    it("should create a label group", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { labelGroupId } = await asUser.mutation(api.labelGroups.createLabelGroup, {
        projectId,
        name: "Group 1",
        description: "Test Group",
      });

      expect(labelGroupId).toBeDefined();

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      // The list query returns groups with labels, and potentially an "Ungrouped" group if there are ungrouped labels.
      // Since we have no labels yet, we expect 1 group.
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe("Group 1");
    });
  });

  describe("update", () => {
    it("should update label group", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { labelGroupId } = await asUser.mutation(api.labelGroups.createLabelGroup, {
        projectId,
        name: "Group 1",
      });

      const result = await asUser.mutation(api.labelGroups.update, {
        id: labelGroupId,
        name: "Group Updated",
      });
      // Currently returns { success: true }
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      expect(groups[0].name).toBe("Group Updated");
    });
  });

  describe("remove", () => {
    it("should remove label group", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { labelGroupId } = await asUser.mutation(api.labelGroups.createLabelGroup, {
        projectId,
        name: "Group 1",
      });

      const result = await asUser.mutation(api.labelGroups.remove, {
        id: labelGroupId,
      });
      // Should return { success: true, deleted: true }
      expect(result).toEqual({ success: true, deleted: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      expect(groups).toHaveLength(0);
    });
  });
});
