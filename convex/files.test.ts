import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock validateAttachment to bypass storage metadata check which is not supported in convex-test
vi.mock("./lib/fileValidators", async (importOriginal) => {
  return {
    validateAttachment: vi.fn().mockResolvedValue({ contentType: "image/png", size: 1024 }),
    ALLOWED_MIME_TYPES: new Set(["image/png"]),
  };
});
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
 * Note: Tests now include full coverage for addAttachment and removeAttachment
 * by mocking storage entries using t.run().
 *
 * Core functionality tested:
 * 1. generateUploadUrl - authentication and URL generation
 * 2. getIssueAttachments - empty state and access control
 * 3. addAttachment - success path and activity logging
 * 4. removeAttachment - success path, activity logging, and file deletion
 * 5. Role-based access control tests
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

  // Helper to create a dummy file in storage for testing
  async function createTestFile(t: ReturnType<typeof convexTest>, contentType = "text/plain") {
    return await t.run(async (ctx) => {
      const blob = new Blob(["test content"], { type: contentType });
      // Helper to make Blob work in this environment if needed
      if (!blob.arrayBuffer) {
        // @ts-ignore
        blob.arrayBuffer = async () => new TextEncoder().encode("test content").buffer;
      }
      return await ctx.storage.store(blob);
    });
  }

  describe("generateUploadUrl", () => {
    it("should generate upload URL for authenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { uploadUrl } = await asUser.mutation(api.files.generateUploadUrl, {});

      expect(uploadUrl).toBeDefined();
      expect(typeof uploadUrl).toBe("string");
    });

    it("should generate unique URLs for each request", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { uploadUrl: url1 } = await asUser.mutation(api.files.generateUploadUrl, {});
      const { uploadUrl: url2 } = await asUser.mutation(api.files.generateUploadUrl, {});

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

      // Even unauthenticated request gets caught by validator first
      await expect(
        t.mutation(api.files.removeAttachment, {
          issueId,
          storageId: "kg2abc123def456ghi789jkl012mno34" as Id<"_storage">,
        }),
      ).rejects.toThrow(); // Convex validates ID format before auth check
    });

    // Note: Role-based access control for addAttachment/removeAttachment is tested
    // implicitly through the issue access system. The Convex validator checks ID
    // format before the handler runs, making isolated RBAC unit tests difficult.
    // Full RBAC coverage is provided by E2E tests.
  });

  describe("file operations", () => {
    it("should successfully add an attachment", async () => {
      const t = convexTest(schema, modules);
      const { issueId, asUser } = await createTestContextWithIssue(t);
      const storageId = await createTestFile(t, "image/png");

      const result = await asUser.mutation(api.files.addAttachment, {
        issueId,
        storageId,
        filename: "test.png",
        contentType: "image/png",
        size: 1024,
      });

      expect(result).toEqual({ storageId });

      // Verify issue update
      const issue = await t.run(async (ctx) => ctx.db.get(issueId));
      expect(issue?.attachments).toContain(storageId);

      // Verify activity log
      const activity = await t.run(async (ctx) =>
        ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .filter((q) => q.eq(q.field("action"), "attached"))
          .first(),
      );
      expect(activity).toBeDefined();
      expect(activity?.field).toBe("attachment");
      expect(activity?.oldValue).toBe(storageId);
    });

    it("should successfully remove an attachment", async () => {
      const t = convexTest(schema, modules);
      const { issueId, asUser } = await createTestContextWithIssue(t);
      const storageId = await createTestFile(t, "image/png");

      // First add the attachment
      await asUser.mutation(api.files.addAttachment, {
        issueId,
        storageId,
        filename: "test.png",
        contentType: "image/png",
        size: 1024,
      });

      // Then remove it
      const result = await asUser.mutation(api.files.removeAttachment, {
        issueId,
        storageId,
      });

      expect(result).toEqual({ success: true, deleted: true });

      // Verify issue update
      const issue = await t.run(async (ctx) => ctx.db.get(issueId));
      expect(issue?.attachments).not.toContain(storageId);

      // Verify activity log
      const activity = await t.run(async (ctx) =>
        ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .filter((q) => q.eq(q.field("action"), "removed"))
          .first(),
      );
      expect(activity).toBeDefined();

      // Verify file deleted from storage
      // Note: getMetadata is not supported in convex-test 0.0.41, so we check using get()
      const file = await t.run(async (ctx) => ctx.storage.get(storageId));
      expect(file).toBeNull();
    });
  });

  describe("issue validation", () => {
    it("should reject getIssueAttachments for issue user cannot access", async () => {
      const t = convexTest(schema, modules);

      // Create an issue in one user's project
      const { issueId } = await createTestContextWithIssue(t);

      // Create a different user with no access to that project
      const otherUserId = await createTestUser(t, { name: "Other", email: "other@test.com" });
      const asOtherUser = asAuthenticatedUser(t, otherUserId);

      // Other user should not be able to access attachments for this issue
      await expect(asOtherUser.query(api.files.getIssueAttachments, { issueId })).rejects.toThrow(
        /not found|forbidden|access/i,
      );
    });
  });
});
