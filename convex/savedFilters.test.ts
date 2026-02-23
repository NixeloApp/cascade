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

describe("Saved Filters", () => {
  describe("create", () => {
    it("should create a saved filter for project viewer", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "My Filter",
        filters: {
          type: ["bug"],
          priority: ["high"],
        },
        isPublic: false,
      });

      expect(filterId).toBeDefined();

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      expect(filters).toHaveLength(1);
      expect(filters[0].name).toBe("My Filter");
      expect(filters[0].isOwner).toBe(true);
    });

    it("should create public filter visible to other project members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member", email: "member@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      await addProjectMember(t, projectId, memberId, "viewer", ownerId);

      // Owner creates public filter
      const asOwner = asAuthenticatedUser(t, ownerId);
      await asOwner.mutation(api.savedFilters.create, {
        projectId,
        name: "Public Filter",
        filters: { status: ["todo"] },
        isPublic: true,
      });

      // Member should see the public filter
      const asMember = asAuthenticatedUser(t, memberId);
      const memberFilters = await asMember.query(api.savedFilters.list, { projectId });

      expect(memberFilters).toHaveLength(1);
      expect(memberFilters[0].name).toBe("Public Filter");
      expect(memberFilters[0].isOwner).toBe(false);
    });

    it("should not show private filters to other users", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const memberId = await createTestUser(t, { name: "Member", email: "member@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      await addProjectMember(t, projectId, memberId, "viewer", ownerId);

      // Owner creates private filter
      const asOwner = asAuthenticatedUser(t, ownerId);
      await asOwner.mutation(api.savedFilters.create, {
        projectId,
        name: "Private Filter",
        filters: { status: ["done"] },
        isPublic: false,
      });

      // Member should NOT see the private filter
      const asMember = asAuthenticatedUser(t, memberId);
      const memberFilters = await asMember.query(api.savedFilters.list, { projectId });

      expect(memberFilters).toHaveLength(0);
    });

    it("should support all filter types", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "Complex Filter",
        filters: {
          type: ["bug", "task"],
          status: ["todo", "in_progress"],
          priority: ["high", "medium"],
          labels: ["urgent", "needs-review"],
        },
        isPublic: true,
      });

      expect(filterId).toBeDefined();

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      const filter = filters.find((f) => f._id === filterId);
      expect(filter?.filters.type).toEqual(["bug", "task"]);
      expect(filter?.filters.status).toEqual(["todo", "in_progress"]);
      expect(filter?.filters.priority).toEqual(["high", "medium"]);
      expect(filter?.filters.labels).toEqual(["urgent", "needs-review"]);
    });
  });

  describe("list", () => {
    it("should return own filters and public filters from others", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, user1Id, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      await addProjectMember(t, projectId, user2Id, "editor", user1Id);

      // User 1 creates public and private filters
      const asUser1 = asAuthenticatedUser(t, user1Id);
      await asUser1.mutation(api.savedFilters.create, {
        projectId,
        name: "User1 Public",
        filters: {},
        isPublic: true,
      });
      await asUser1.mutation(api.savedFilters.create, {
        projectId,
        name: "User1 Private",
        filters: {},
        isPublic: false,
      });

      // User 2 creates a filter
      const asUser2 = asAuthenticatedUser(t, user2Id);
      await asUser2.mutation(api.savedFilters.create, {
        projectId,
        name: "User2 Filter",
        filters: {},
        isPublic: false,
      });

      // User 2 should see: own filter + User1's public filter
      const user2Filters = await asUser2.query(api.savedFilters.list, { projectId });
      expect(user2Filters).toHaveLength(2);
      expect(user2Filters.map((f) => f.name).sort()).toEqual(["User1 Public", "User2 Filter"]);
    });

    it("should include creator name for each filter", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "My Filter",
        filters: {},
        isPublic: false,
      });

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      expect(filters[0].creatorName).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update own filter", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "Original Name",
        filters: { type: ["bug"] },
        isPublic: false,
      });

      const result = await asUser.mutation(api.savedFilters.update, {
        id: filterId,
        name: "Updated Name",
        filters: { type: ["task"] },
        isPublic: true,
      });

      expect(result).toEqual({ success: true });

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      const updated = filters.find((f) => f._id === filterId);
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.filters.type).toEqual(["task"]);
      expect(updated?.isPublic).toBe(true);
    });

    it("should reject updating other user's filter", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { filterId } = await asOwner.mutation(api.savedFilters.create, {
        projectId,
        name: "Owner Filter",
        filters: {},
        isPublic: true,
      });

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(
        asOther.mutation(api.savedFilters.update, {
          id: filterId,
          name: "Hijacked!",
        }),
      ).rejects.toThrow(/FORBIDDEN|Not authorized/);
    });

    it("should allow partial updates", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "Original",
        filters: { type: ["bug"] },
        isPublic: false,
      });

      // Only update name
      const result = await asUser.mutation(api.savedFilters.update, {
        id: filterId,
        name: "New Name",
      });

      expect(result).toEqual({ success: true });

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      const updated = filters.find((f) => f._id === filterId);
      expect(updated?.name).toBe("New Name");
      expect(updated?.filters.type).toEqual(["bug"]); // Unchanged
      expect(updated?.isPublic).toBe(false); // Unchanged
    });
  });

  describe("remove", () => {
    it("should delete own filter", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "To Delete",
        filters: {},
        isPublic: false,
      });

      const result = await asUser.mutation(api.savedFilters.remove, { id: filterId });

      expect(result).toEqual({ success: true });

      const filters = await asUser.query(api.savedFilters.list, { projectId });
      expect(filters).toHaveLength(0);
    });

    it("should reject deleting other user's filter", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });
      const { organizationId } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, ownerId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { filterId } = await asOwner.mutation(api.savedFilters.create, {
        projectId,
        name: "Owner Filter",
        filters: {},
        isPublic: true,
      });

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(asOther.mutation(api.savedFilters.remove, { id: filterId })).rejects.toThrow(
        /FORBIDDEN|Not authorized/,
      );
    });

    it("should throw error for non-existent filter", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const projectId = await createProjectInOrganization(t, userId, organizationId, {
        name: "Test Project",
        key: "TEST",
      });

      // Create and delete to get valid non-existent ID
      const { filterId } = await asUser.mutation(api.savedFilters.create, {
        projectId,
        name: "Temp",
        filters: {},
        isPublic: false,
      });

      await asUser.mutation(api.savedFilters.remove, { id: filterId });

      // Try to delete again
      await expect(asUser.mutation(api.savedFilters.remove, { id: filterId })).rejects.toThrow(
        /not found/i,
      );
    });
  });
});
