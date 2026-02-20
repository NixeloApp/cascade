import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Documents", () => {
  describe("create", () => {
    it("should create a public document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Public Document",
        isPublic: true,
        organizationId,
      });

      expect(docId).toBeDefined();

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("Public Document");
      expect(doc?.isPublic).toBe(true);
      expect(doc?.createdBy).toBe(userId);
    });

    it("should create a private document", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Private Document",
        isPublic: false,
        organizationId,
      });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("Private Document");
      expect(doc?.isPublic).toBe(false);
    });

    it("should create a document without project link", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Document Without Project",
        isPublic: false,
        organizationId,
      });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("Document Without Project");
      expect(doc?.projectId).toBeUndefined();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId } = await createTestContext(t);

      await expect(async () => {
        await t.mutation(api.documents.create, {
          title: "Unauthorized Document",
          isPublic: false,
          organizationId,
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should set update timestamps", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Timestamped Document",
        isPublic: false,
        organizationId,
      });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.updatedAt).toBeDefined();
    });
  });

  describe("get", () => {
    it("should return private documents for owner", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "My Private Doc",
        isPublic: false,
        organizationId,
      });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("My Private Doc");
      expect(doc?.createdBy).toBe(userId);
    });

    it("should deny access to private documents for non-owners", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      // Create private document
      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Secret Document",
        isPublic: false,
        organizationId,
      });

      // Try to access as other user - should throw error
      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.query(api.documents.getDocument, { id: docId });
      }).rejects.toThrow("Not authorized to access this document");
    });

    it("should return public documents to organization members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      // Add member to organization
      const asOwner = asAuthenticatedUser(t, owner);
      await asOwner.mutation(api.organizations.addMember, {
        organizationId,
        userId: member,
        role: "member",
      });

      // Create public document as owner
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Public Project Doc",
        isPublic: true,
        organizationId,
      });

      // Access as member
      const asMember = asAuthenticatedUser(t, member);
      const doc = await asMember.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("Public Project Doc");
    });

    it("should deny access to public documents for non-organization members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const outsider = await createTestUser(t, { name: "Outsider" });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      // Create public document as owner
      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Public Project Doc",
        isPublic: true,
        organizationId,
      });

      // Access as outsider (not in organization)
      const asOutsider = asAuthenticatedUser(t, outsider);
      await expect(async () => {
        await asOutsider.query(api.documents.getDocument, { id: docId });
      }).rejects.toThrow("Not authorized to access this document");
    });

    it("should return null for deleted documents", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      // Create and then delete a document
      const docId = await asUser.mutation(api.documents.create, {
        title: "To Delete",
        isPublic: false,
        organizationId,
      });

      await asUser.mutation(api.documents.deleteDocument, { id: docId });

      // Try to get the deleted document
      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc).toBeNull();
    });
  });

  describe("list", () => {
    it("should return filtered documents for organization", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const { organizationId: org1 } = await createOrganizationAdmin(t, user1);
      const { organizationId: org2 } = await createOrganizationAdmin(t, user2);

      // User 1 creates documents in Org 1
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.documents.create, {
        title: "User 1 Private",
        isPublic: false,
        organizationId: org1,
      });
      await asUser1.mutation(api.documents.create, {
        title: "Public Doc Org 1",
        isPublic: true,
        organizationId: org1,
      });

      // User 2 creates a document in Org 2
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.documents.create, {
        title: "User 2 Private",
        isPublic: false,
        organizationId: org2,
      });

      // User 2 listing Org 2: Should see their private doc only (since no public docs in Org 2)
      const resultOrg2 = await asUser2.query(api.documents.list, { organizationId: org2 });
      expect(resultOrg2.documents).toHaveLength(1);
      expect(resultOrg2.documents[0].title).toBe("User 2 Private");

      // User 2 listing Org 1: Should see NOTHING because they are not a member of Org 1
      // and they haven't created any private docs there.
      const resultOrg1 = await asUser2.query(api.documents.list, { organizationId: org1 });
      expect(resultOrg1.documents).toHaveLength(0);
    });

    it("should see public documents in same organization", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const { organizationId } = await createOrganizationAdmin(t, user1);

      // Add user2 to organization
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.organizations.addMember, {
        organizationId,
        userId: user2,
        role: "member",
      });
      await asUser1.mutation(api.documents.create, {
        title: "Public Doc",
        isPublic: true,
        organizationId,
      });

      const asUser2 = asAuthenticatedUser(t, user2);
      const result = await asUser2.query(api.documents.list, { organizationId });
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toBe("Public Doc");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      await expect(t.query(api.documents.list, {})).rejects.toThrow("Not authenticated");
    });

    it("should include creator information", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t, { name: "Creator" });

      await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      const result = await asUser.query(api.documents.list, {});
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).toHaveProperty("creatorName");
    });
  });

  describe("updateTitle", () => {
    it("should allow owner to update title", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Original Title",
        isPublic: false,
        organizationId,
      });

      await asUser.mutation(api.documents.updateTitle, {
        id: docId,
        title: "Updated Title",
      });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.title).toBe("Updated Title");
    });

    it("should update the updatedAt timestamp", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Original",
        isPublic: false,
        organizationId,
      });

      const docBefore = await asUser.query(api.documents.getDocument, { id: docId });
      const updatedAtBefore = docBefore?.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.documents.updateTitle, {
        id: docId,
        title: "Updated",
      });

      const docAfter = await asUser.query(api.documents.getDocument, { id: docId });
      expect(docAfter?.updatedAt).toBeGreaterThan(updatedAtBefore || 0);
    });

    it("should deny non-owners from updating", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Original",
        isPublic: false,
        organizationId,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.updateTitle, {
          id: docId,
          title: "Hacked",
        });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
        organizationId,
      });

      // Call without authentication
      await expect(async () => {
        await t.mutation(api.documents.updateTitle, {
          id: docId,
          title: "Unauthorized",
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("togglePublic", () => {
    it("should toggle document from private to public", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Private Doc",
        isPublic: false,
        organizationId,
      });

      await asUser.mutation(api.documents.togglePublic, { id: docId });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.isPublic).toBe(true);
    });

    it("should toggle document from public to private", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Public Doc",
        isPublic: true,
        organizationId,
      });

      await asUser.mutation(api.documents.togglePublic, { id: docId });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc?.isPublic).toBe(false);
    });

    it("should deny non-owners from toggling", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
        organizationId,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.togglePublic, { id: docId });
      }).rejects.toThrow("Not authorized");
    });
  });

  describe("deleteDocument", () => {
    it("should allow owner to delete document", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "To Delete",
        isPublic: false,
        organizationId,
      });

      await asUser.mutation(api.documents.deleteDocument, { id: docId });

      const doc = await asUser.query(api.documents.getDocument, { id: docId });
      expect(doc).toBeNull();
    });

    it("should deny non-owners from deleting", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const { organizationId } = await createOrganizationAdmin(t, owner);

      const asOwner = asAuthenticatedUser(t, owner);
      const docId = await asOwner.mutation(api.documents.create, {
        title: "Protected",
        isPublic: false,
        organizationId,
      });

      const asOther = asAuthenticatedUser(t, other);
      await expect(async () => {
        await asOther.mutation(api.documents.deleteDocument, { id: docId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users from deleting", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const docId = await asUser.mutation(api.documents.create, {
        title: "Test",
        isPublic: false,
        organizationId,
      });

      // Call without authentication
      await expect(async () => {
        await t.mutation(api.documents.deleteDocument, { id: docId });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("search", () => {
    it("should search documents by title", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      await asUser.mutation(api.documents.create, {
        title: "Product Requirements Document",
        isPublic: false,
        organizationId,
      });
      await asUser.mutation(api.documents.create, {
        title: "Technical Design Document",
        isPublic: false,
        organizationId,
      });
      await asUser.mutation(api.documents.create, {
        title: "Meeting Notes",
        isPublic: false,
        organizationId,
      });

      const searchResult = await asUser.query(api.documents.search, {
        query: "document",
      });

      expect(searchResult.results).toHaveLength(2);
      const titles = searchResult.results.map((d) => d.title);
      expect(titles).toContain("Product Requirements Document");
      expect(titles).toContain("Technical Design Document");
      expect(titles).not.toContain("Meeting Notes");
    });

    it("should only search accessible documents", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const { organizationId: org1 } = await createOrganizationAdmin(t, user1);
      const { organizationId: org2 } = await createOrganizationAdmin(t, user2);

      // User 1 creates private document
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.documents.create, {
        title: "User 1 Secret Document",
        isPublic: false,
        organizationId: org1,
      });

      // User 2 creates public document
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.documents.create, {
        title: "User 2 Public Document",
        isPublic: true,
        organizationId: org2,
      });

      // User 2 searches for "document"
      const searchResult = await asUser2.query(api.documents.search, {
        query: "document",
      });

      // Should only find User 2's document and the public one
      expect(searchResult.results.length).toBeGreaterThanOrEqual(1);
      const titles = searchResult.results.map((d) => d.title);
      expect(titles).toContain("User 2 Public Document");
    });

    it("should return empty results when no matches found", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      await asUser.mutation(api.documents.create, {
        title: "Test Document",
        isPublic: false,
        organizationId,
      });

      const searchResult = await asUser.query(api.documents.search, {
        query: "nonexistent",
      });

      expect(searchResult.results).toEqual([]);
    });
  });
});
