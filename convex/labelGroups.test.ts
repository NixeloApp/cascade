import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Label Groups", () => {
  async function createLabel(
    t: ReturnType<typeof convexTest>,
    projectId: Id<"projects">,
    userId: Id<"users">,
    name: string,
    color: string,
    groupId?: Id<"labelGroups">,
  ) {
    return await t.run(async (ctx) => {
      return await ctx.db.insert("labels", {
        projectId,
        name,
        color,
        groupId,
        displayOrder: 0,
        createdBy: userId,
      });
    });
  }

  describe("create", () => {
    it("should create a label group for project editor", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Priority",
        description: "Priority labels",
      });

      expect(groupId).toBeDefined();

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      expect(groups.some((g) => g.name === "Priority")).toBe(true);
    });

    it("should reject duplicate group names in same project", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Status",
      });

      await expect(
        asUser.mutation(api.labelGroups.create, {
          projectId,
          name: "Status",
        }),
      ).rejects.toThrow(/already exists/i);
    });

    it("should assign incremental display order", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      await asUser.mutation(api.labelGroups.create, { projectId, name: "Group 1" });
      await asUser.mutation(api.labelGroups.create, { projectId, name: "Group 2" });
      await asUser.mutation(api.labelGroups.create, { projectId, name: "Group 3" });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const namedGroups = groups.filter((g) => g.name !== "Ungrouped");

      expect(namedGroups[0].displayOrder).toBe(1);
      expect(namedGroups[1].displayOrder).toBe(2);
      expect(namedGroups[2].displayOrder).toBe(3);
    });
  });

  describe("list", () => {
    it("should return groups with their labels", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Priority",
      });

      // Create labels in the group
      await createLabel(t, projectId, userId, "High", "#ff0000", groupId);
      await createLabel(t, projectId, userId, "Medium", "#ffff00", groupId);

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const priorityGroup = groups.find((g) => g.name === "Priority");

      expect(priorityGroup).toBeDefined();
      expect(priorityGroup?.labels).toHaveLength(2);
    });

    it("should include ungrouped labels at the end", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      // Create ungrouped label
      await createLabel(t, projectId, userId, "Orphan", "#cccccc");

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const ungrouped = groups.find((g) => g.name === "Ungrouped");

      expect(ungrouped).toBeDefined();
      expect(ungrouped?.labels).toHaveLength(1);
      expect(ungrouped?.labels[0].name).toBe("Orphan");
    });

    it("should sort groups by display order", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      await asUser.mutation(api.labelGroups.create, { projectId, name: "Zebra" });
      await asUser.mutation(api.labelGroups.create, { projectId, name: "Alpha" });
      await asUser.mutation(api.labelGroups.create, { projectId, name: "Middle" });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const namedGroups = groups.filter((g) => g.name !== "Ungrouped");

      // Should be in creation order (by displayOrder), not alphabetical
      expect(namedGroups[0].name).toBe("Zebra");
      expect(namedGroups[1].name).toBe("Alpha");
      expect(namedGroups[2].name).toBe("Middle");
    });
  });

  describe("update", () => {
    it("should update group name and description", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Old Name",
      });

      const result = await asUser.mutation(api.labelGroups.update, {
        id: groupId,
        name: "New Name",
        description: "Updated description",
      });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const updated = groups.find((g) => g._id === groupId);

      expect(updated?.name).toBe("New Name");
      expect(updated?.description).toBe("Updated description");
    });

    it("should reject updating to duplicate name", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      await asUser.mutation(api.labelGroups.create, { projectId, name: "Existing" });
      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "To Update",
      });

      await expect(
        asUser.mutation(api.labelGroups.update, {
          id: groupId,
          name: "Existing",
        }),
      ).rejects.toThrow(/already exists/i);
    });

    it("should reject non-editor updating group", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      await addProjectMember(t, projectId, viewerId, "viewer", ownerId);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const groupId = await asOwner.mutation(api.labelGroups.create, {
        projectId,
        name: "Test Group",
      });

      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(
        asViewer.mutation(api.labelGroups.update, {
          id: groupId,
          name: "Hijacked",
        }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("should delete group and ungroup its labels", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "To Delete",
      });

      const labelId = await createLabel(t, projectId, userId, "In Group", "#ff0000", groupId);

      const result = await asUser.mutation(api.labelGroups.remove, { id: groupId });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });

      // Group should be gone
      expect(groups.find((g) => g.name === "To Delete")).toBeUndefined();

      // Label should be in ungrouped
      const ungrouped = groups.find((g) => g.name === "Ungrouped");
      expect(ungrouped?.labels.some((l) => l._id === labelId)).toBe(true);
    });
  });

  describe("reorder", () => {
    it("should reorder groups", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const group1 = await asUser.mutation(api.labelGroups.create, { projectId, name: "First" });
      const group2 = await asUser.mutation(api.labelGroups.create, { projectId, name: "Second" });
      const group3 = await asUser.mutation(api.labelGroups.create, { projectId, name: "Third" });

      // Reorder: Third, First, Second
      const result = await asUser.mutation(api.labelGroups.reorder, {
        projectId,
        groupIds: [group3, group1, group2],
      });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const namedGroups = groups.filter((g) => g.name !== "Ungrouped");

      expect(namedGroups[0].name).toBe("Third");
      expect(namedGroups[1].name).toBe("First");
      expect(namedGroups[2].name).toBe("Second");
    });

    it("should reject groups from different project", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const project1 = await createProjectInOrganization(t, userId, organizationId, {
        name: "Project 1",
        key: "P1",
      });
      const project2 = await createProjectInOrganization(t, userId, organizationId, {
        name: "Project 2",
        key: "P2",
      });

      const group1 = await asUser.mutation(api.labelGroups.create, {
        projectId: project1,
        name: "Group 1",
      });
      const group2 = await asUser.mutation(api.labelGroups.create, {
        projectId: project2,
        name: "Group 2",
      });

      await expect(
        asUser.mutation(api.labelGroups.reorder, {
          projectId: project1,
          groupIds: [group1, group2],
        }),
      ).rejects.toThrow(/different project/i);
    });
  });

  describe("moveLabel", () => {
    it("should move label to a different group", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const group1 = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Group 1",
      });
      const group2 = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Group 2",
      });

      const labelId = await createLabel(t, projectId, userId, "Moving", "#ff0000", group1);

      const result = await asUser.mutation(api.labelGroups.moveLabel, {
        projectId,
        labelId,
        groupId: group2,
      });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const targetGroup = groups.find((g) => g._id === group2);

      expect(targetGroup?.labels.some((l) => l._id === labelId)).toBe(true);
    });

    it("should move label to ungrouped (null)", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Source Group",
      });

      const labelId = await createLabel(t, projectId, userId, "To Ungroup", "#ff0000", groupId);

      const result = await asUser.mutation(api.labelGroups.moveLabel, {
        projectId,
        labelId,
        groupId: null,
      });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const ungrouped = groups.find((g) => g.name === "Ungrouped");

      expect(ungrouped?.labels.some((l) => l._id === labelId)).toBe(true);
    });
  });

  describe("reorderLabels", () => {
    it("should reorder labels within a group", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "LBL",
      });

      const groupId = await asUser.mutation(api.labelGroups.create, {
        projectId,
        name: "Test Group",
      });

      const label1 = await createLabel(t, projectId, userId, "Label 1", "#ff0000", groupId);
      const label2 = await createLabel(t, projectId, userId, "Label 2", "#00ff00", groupId);
      const label3 = await createLabel(t, projectId, userId, "Label 3", "#0000ff", groupId);

      // Reorder: 3, 1, 2
      const result = await asUser.mutation(api.labelGroups.reorderLabels, {
        projectId,
        groupId,
        labelIds: [label3, label1, label2],
      });
      expect(result).toEqual({ success: true });

      const groups = await asUser.query(api.labelGroups.list, { projectId });
      const group = groups.find((g) => g._id === groupId);
      const labels = group?.labels || [];

      expect(labels[0].name).toBe("Label 3");
      expect(labels[1].name).toBe("Label 1");
      expect(labels[2].name).toBe("Label 2");
    });
  });
});
