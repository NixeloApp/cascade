import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

/**
 * Files tests
 *
 * Note: Tests involving actual file storage (addAttachment, removeAttachment)
 * are limited because convex-test doesn't provide a way to create mock storage
 * entries. The core functionality is tested through:
 * 1. generateUploadUrl - authentication and URL generation
 * 2. getIssueAttachments - empty state and access control
 * 3. Role-based access control tests
 *
 * Full integration testing with actual file uploads should be done via E2E tests.
 */
describe("Files", () => {
  // Helper to create full context with project and issue
  async function createTestContextWithIssue(t: ReturnType<typeof convexTest>) {
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Files Test Project",
      key: "FTP",
    });
    const issueId = await createTestIssue(t, projectId, userId, {
      title: "Test Issue for Attachments",
    });
    const asUser = asAuthenticatedUser(t, userId);

    return { userId, organizationId, projectId, issueId, asUser };
  }

  describe("generateUploadUrl", () => {
    it("should generate upload URL for authenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const uploadUrl = await asUser.mutation(api.files.generateUploadUrl, {});

      expect(uploadUrl).toBeDefined();
      expect(typeof uploadUrl).toBe("string");
    });

    it("should generate unique URLs for each request", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const url1 = await asUser.mutation(api.files.generateUploadUrl, {});
      const url2 = await asUser.mutation(api.files.generateUploadUrl, {});

      // URLs should be unique
      expect(url1).not.toBe(url2);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(/authenticated/i);
    });
  });

  describe("getIssueAttachments", () => {
    it("should return empty array when no attachments", async () => {
      const t = convexTest(schema, modules);
      const { issueId, asUser } = await createTestContextWithIssue(t);

      const attachments = await asUser.query(api.files.getIssueAttachments, { issueId });

      expect(attachments).toEqual([]);
    });

    it("should return empty array for issue with empty attachments array", async () => {
      const t = convexTest(schema, modules);
      const { issueId, asUser } = await createTestContextWithIssue(t);

      // Explicitly set attachments to empty array
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId, { attachments: [] });
      });

      const attachments = await asUser.query(api.files.getIssueAttachments, { issueId });

      expect(attachments).toEqual([]);
    });

    it("should allow project admin to view attachments", async () => {
      const t = convexTest(schema, modules);
      const { issueId, asUser } = await createTestContextWithIssue(t);

      // Admin can access the query
      const attachments = await asUser.query(api.files.getIssueAttachments, { issueId });
      expect(Array.isArray(attachments)).toBe(true);
    });

    it("should allow project editor to view attachments", async () => {
      const t = convexTest(schema, modules);
      const { projectId, issueId, userId } = await createTestContextWithIssue(t);

      // Create editor
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
      await addProjectMember(t, projectId, editorId, "editor", userId);
      const asEditor = asAuthenticatedUser(t, editorId);

      const attachments = await asEditor.query(api.files.getIssueAttachments, { issueId });
      expect(Array.isArray(attachments)).toBe(true);
    });

    it("should allow project viewer to view attachments", async () => {
      const t = convexTest(schema, modules);
      const { projectId, issueId, userId } = await createTestContextWithIssue(t);

      // Create viewer
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      const attachments = await asViewer.query(api.files.getIssueAttachments, { issueId });
      expect(Array.isArray(attachments)).toBe(true);
    });

    it("should reject user without project access", async () => {
      const t = convexTest(schema, modules);
      const { issueId } = await createTestContextWithIssue(t);

      // Create unrelated user with no project membership
      const otherUserId = await createTestUser(t, { name: "Other", email: "other@test.com" });
      const asOther = asAuthenticatedUser(t, otherUserId);

      await expect(asOther.query(api.files.getIssueAttachments, { issueId })).rejects.toThrow(
        /FORBIDDEN/i,
      );
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { issueId } = await createTestContextWithIssue(t);

      await expect(t.query(api.files.getIssueAttachments, { issueId })).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("access control", () => {
    it("should require authentication for addAttachment", async () => {
      const t = convexTest(schema, modules);
      const { issueId } = await createTestContextWithIssue(t);

      // Generate a valid upload URL to get storage format right - but we can't actually
      // create a real storage ID without convex-test storage support, so we just test auth
      await expect(
        t.mutation(api.files.addAttachment, {
          issueId,
          storageId: "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">,
          filename: "test.pdf",
          contentType: "application/pdf",
          size: 1024,
        }),
      ).rejects.toThrow();
    });

    it("should require authentication for removeAttachment", async () => {
      const t = convexTest(schema, modules);
      const { issueId } = await createTestContextWithIssue(t);

      await expect(
        t.mutation(api.files.removeAttachment, {
          issueId,
          storageId: "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">,
        }),
      ).rejects.toThrow();
    });

    it("should reject addAttachment without editor role", async () => {
      const t = convexTest(schema, modules);
      const { projectId, issueId, userId } = await createTestContextWithIssue(t);

      // Create viewer
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      // Even with invalid storage ID, role check should happen first
      await expect(
        asViewer.mutation(api.files.addAttachment, {
          issueId,
          storageId: "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">,
          filename: "test.pdf",
          contentType: "application/pdf",
          size: 1024,
        }),
      ).rejects.toThrow();
    });

    it("should reject removeAttachment without editor role", async () => {
      const t = convexTest(schema, modules);
      const { projectId, issueId, userId } = await createTestContextWithIssue(t);

      // Create viewer
      const viewerId = await createTestUser(t, { name: "Viewer", email: "viewer@test.com" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      await expect(
        asViewer.mutation(api.files.removeAttachment, {
          issueId,
          storageId: "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">,
        }),
      ).rejects.toThrow();
    });
  });

  describe("issue validation", () => {
    it("should reject getIssueAttachments for non-existent issue", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      // Use a valid-format but non-existent issue ID
      const fakeIssueId = "j57bhd2rvp0w0qb8t1s1zrh17h6yggn1" as Id<"issues">;

      await expect(
        asUser.query(api.files.getIssueAttachments, { issueId: fakeIssueId }),
      ).rejects.toThrow();
    });
  });
});
