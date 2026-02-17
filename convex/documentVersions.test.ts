import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Document Versions", () => {
  async function createDocument(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    organizationId: Id<"organizations">,
    options: { title?: string; isPublic?: boolean } = {},
  ) {
    return await t.run(async (ctx) => {
      return await ctx.db.insert("documents", {
        title: options.title ?? "Test Document",
        createdBy: userId,
        organizationId,
        isPublic: options.isPublic ?? false,
        updatedAt: Date.now(),
      });
    });
  }

  async function createVersion(
    t: ReturnType<typeof convexTest>,
    documentId: Id<"documents">,
    userId: Id<"users">,
    version: number,
    options: { title?: string; snapshot?: { type: "doc"; content?: unknown[] } } = {},
  ) {
    return await t.run(async (ctx) => {
      return await ctx.db.insert("documentVersions", {
        documentId,
        version,
        title: options.title ?? `Version ${version}`,
        snapshot: options.snapshot ?? { type: "doc", content: [{ text: `snapshot ${version}` }] },
        createdBy: userId,
      });
    });
  }

  describe("listVersions", () => {
    it("should list all versions for own document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      await createVersion(t, docId, userId, 1);
      await createVersion(t, docId, userId, 2);
      await createVersion(t, docId, userId, 3);

      const versions = await asUser.query(api.documentVersions.listVersions, {
        documentId: docId,
      });

      expect(versions).toHaveLength(3);
      // Should be in descending order (newest first)
      expect(versions[0].version).toBe(3);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(1);
    });

    it("should include creator name for each version", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      await createVersion(t, docId, userId, 1);

      const versions = await asUser.query(api.documentVersions.listVersions, {
        documentId: docId,
      });

      expect(versions[0].createdByName).toBeDefined();
    });

    it("should allow access to public document versions", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });

      const docId = await createDocument(t, ownerId, organizationId, { isPublic: true });
      await createVersion(t, docId, ownerId, 1);

      const asOther = asAuthenticatedUser(t, otherId);
      const versions = await asOther.query(api.documentVersions.listVersions, {
        documentId: docId,
      });

      expect(versions).toHaveLength(1);
    });

    it("should deny access to private document versions", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });

      const docId = await createDocument(t, ownerId, organizationId, { isPublic: false });
      await createVersion(t, docId, ownerId, 1);

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(
        asOther.query(api.documentVersions.listVersions, { documentId: docId }),
      ).rejects.toThrow(/FORBIDDEN|Not authorized/);
    });

    it("should throw error for non-existent document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const docId = await createDocument(t, userId, organizationId);
      await t.run(async (ctx) => ctx.db.delete(docId));

      await expect(
        asUser.query(api.documentVersions.listVersions, { documentId: docId }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("getVersion", () => {
    it("should get specific version details", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      const testSnapshot = { type: "doc" as const, content: [{ text: "specific data" }] };
      const versionId = await createVersion(t, docId, userId, 1, {
        title: "Specific Version",
        snapshot: testSnapshot,
      });

      const version = await asUser.query(api.documentVersions.getVersion, {
        documentId: docId,
        versionId,
      });

      expect(version.title).toBe("Specific Version");
      expect(version.snapshot).toEqual(testSnapshot);
      expect(version.createdByName).toBeDefined();
    });

    it("should deny access to version from different document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const doc1 = await createDocument(t, userId, organizationId);
      const doc2 = await createDocument(t, userId, organizationId);
      const versionId = await createVersion(t, doc1, userId, 1);

      await expect(
        asUser.query(api.documentVersions.getVersion, {
          documentId: doc2,
          versionId,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("restoreVersion", () => {
    it("should restore version and return snapshot data", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      const restoredSnapshot = { type: "doc" as const, content: [{ text: "restored content" }] };
      const versionId = await createVersion(t, docId, userId, 1, {
        title: "Old Title",
        snapshot: restoredSnapshot,
      });

      const result = await asUser.mutation(api.documentVersions.restoreVersion, {
        documentId: docId,
        versionId,
      });

      expect(result.title).toBe("Old Title");
      expect(result.snapshot).toEqual(restoredSnapshot);
      expect(result.version).toBe(1);
    });

    it("should only allow owner to restore", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });

      // Even public documents can only be restored by owner
      const docId = await createDocument(t, ownerId, organizationId, { isPublic: true });
      const versionId = await createVersion(t, docId, ownerId, 1);

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(
        asOther.mutation(api.documentVersions.restoreVersion, {
          documentId: docId,
          versionId,
        }),
      ).rejects.toThrow(/FORBIDDEN|Not authorized/);
    });

    it("should reject version from different document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const doc1 = await createDocument(t, userId, organizationId);
      const doc2 = await createDocument(t, userId, organizationId);
      const versionId = await createVersion(t, doc1, userId, 1);

      await expect(
        asUser.mutation(api.documentVersions.restoreVersion, {
          documentId: doc2,
          versionId,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("deleteVersion", () => {
    it("should delete version", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      const versionId = await createVersion(t, docId, userId, 1);

      await asUser.mutation(api.documentVersions.deleteVersion, { versionId });

      const versions = await asUser.query(api.documentVersions.listVersions, {
        documentId: docId,
      });
      expect(versions).toHaveLength(0);
    });

    it("should only allow document owner to delete", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });

      const docId = await createDocument(t, ownerId, organizationId, { isPublic: true });
      const versionId = await createVersion(t, docId, ownerId, 1);

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(
        asOther.mutation(api.documentVersions.deleteVersion, { versionId }),
      ).rejects.toThrow(/FORBIDDEN|Not authorized/);
    });

    it("should throw error for non-existent version", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      const versionId = await createVersion(t, docId, userId, 1);

      // Delete it first
      await asUser.mutation(api.documentVersions.deleteVersion, { versionId });

      // Try to delete again
      await expect(
        asUser.mutation(api.documentVersions.deleteVersion, { versionId }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("getVersionCount", () => {
    it("should return correct count", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);
      await createVersion(t, docId, userId, 1);
      await createVersion(t, docId, userId, 2);
      await createVersion(t, docId, userId, 3);

      const count = await asUser.query(api.documentVersions.getVersionCount, {
        documentId: docId,
      });

      expect(count).toBe(3);
    });

    it("should return 0 for document with no versions", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await createDocument(t, userId, organizationId);

      const count = await asUser.query(api.documentVersions.getVersionCount, {
        documentId: docId,
      });

      expect(count).toBe(0);
    });

    it("should return 0 for non-existent document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const docId = await createDocument(t, userId, organizationId);
      await t.run(async (ctx) => ctx.db.delete(docId));

      const count = await asUser.query(api.documentVersions.getVersionCount, {
        documentId: docId,
      });

      expect(count).toBe(0);
    });

    it("should return 0 for private document accessed by non-owner", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);
      const ownerId = await createTestUser(t, { name: "Owner" });
      const otherId = await createTestUser(t, { name: "Other", email: "other@test.com" });

      const docId = await createDocument(t, ownerId, organizationId, { isPublic: false });
      await createVersion(t, docId, ownerId, 1);

      const asOther = asAuthenticatedUser(t, otherId);
      const count = await asOther.query(api.documentVersions.getVersionCount, {
        documentId: docId,
      });

      // Returns 0 instead of throwing (graceful degradation)
      expect(count).toBe(0);
    });
  });
});
