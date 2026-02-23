/**
 * Unit tests for Y.js backend functions
 *
 * Tests Y.js document state synchronization and awareness functionality.
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import { MINUTE } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createDocumentInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("Y.js Backend", () => {
  describe("getDocumentState", () => {
    it("should return empty state for new documents", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      // Create a document
      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Get Y.js state for the document
      const state = await asUser.query(api.yjs.getDocumentState, {
        documentId: docId,
      });

      expect(state.stateVector).toBeNull();
      expect(state.updates).toEqual([]);
      expect(state.version).toBe(0);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      // Create a document directly in db
      const docId = await createDocumentInOrganization(t, userId, organizationId, {
        title: "Test Doc",
      });

      await expect(async () => {
        await t.query(api.yjs.getDocumentState, { documentId: docId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw for non-existent document", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      // Create and immediately delete a document to get a valid but non-existent ID
      const deletedDocId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("documents", {
          title: "temp",
          isPublic: false,
          createdBy: userId,
          organizationId: organizationId,
          updatedAt: Date.now(),
        });
        await ctx.db.delete(id);
        return id;
      });

      await expect(async () => {
        await asUser.query(api.yjs.getDocumentState, { documentId: deletedDocId });
      }).rejects.toThrow("Document not found");
    });
  });

  describe("applyUpdates", () => {
    it("should create new Y.js document state on first update", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Apply first update
      const result = await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["base64EncodedUpdate1"],
        clientVersion: 0,
      });

      expect(result.version).toBe(1);
      expect(result.conflict).toBe(false);

      // Verify state was created
      const state = await asUser.query(api.yjs.getDocumentState, {
        documentId: docId,
      });

      expect(state.version).toBe(1);
      expect(state.updates).toEqual(["base64EncodedUpdate1"]);
    });

    it("should append updates to existing state", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Apply first update
      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update1"],
        clientVersion: 0,
      });

      // Apply second update
      const result = await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update2"],
        clientVersion: 1,
      });

      expect(result.version).toBe(2);
      expect(result.conflict).toBe(false);

      // Verify both updates are stored
      const state = await asUser.query(api.yjs.getDocumentState, {
        documentId: docId,
      });

      expect(state.updates).toEqual(["update1", "update2"]);
    });

    it("should detect version conflicts", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Apply first update
      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update1"],
        clientVersion: 0,
      });

      // Try to apply update with stale version
      const result = await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["conflictingUpdate"],
        clientVersion: 0, // Client is behind
      });

      expect(result.conflict).toBe(true);
      expect(result.version).toBe(1);
      expect(result.updates).toEqual(["update1"]);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const docId = await createDocumentInOrganization(t, userId, organizationId, {
        title: "Test Doc",
      });

      await expect(async () => {
        await t.mutation(api.yjs.applyUpdates, {
          documentId: docId,
          updates: ["update"],
          clientVersion: 0,
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should update document timestamp", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      const docBefore = await asUser.query(api.documents.getDocument, { id: docId });
      const beforeTimestamp = docBefore?.updatedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update"],
        clientVersion: 0,
      });

      const docAfter = await asUser.query(api.documents.getDocument, { id: docId });
      expect(docAfter?.updatedAt).toBeGreaterThan(beforeTimestamp || 0);
    });
  });

  describe("updateStateVector", () => {
    it("should update state vector when version matches", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create initial Y.js state
      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update1"],
        clientVersion: 0,
      });

      // Update state vector
      const result = await asUser.mutation(api.yjs.updateStateVector, {
        documentId: docId,
        stateVector: "newStateVector",
        version: 1,
      });

      expect(result.success).toBe(true);

      // Verify state vector was updated
      const state = await asUser.query(api.yjs.getDocumentState, {
        documentId: docId,
      });

      expect(state.stateVector).toBe("newStateVector");
    });

    it("should fail when version mismatches", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create initial Y.js state
      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update1"],
        clientVersion: 0,
      });

      // Try to update with wrong version
      const result = await asUser.mutation(api.yjs.updateStateVector, {
        documentId: docId,
        stateVector: "newStateVector",
        version: 99, // Wrong version
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("version_mismatch");
    });

    it("should throw for non-existent Y.js document", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Try to update state vector without creating Y.js state first
      await expect(async () => {
        await asUser.mutation(api.yjs.updateStateVector, {
          documentId: docId,
          stateVector: "newStateVector",
          version: 1,
        });
      }).rejects.toThrow("Y.js document not found");
    });
  });

  describe("compactUpdates", () => {
    it("should replace all updates with merged update", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create initial state with multiple updates
      await asUser.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["update1", "update2", "update3"],
        clientVersion: 0,
      });

      // Compact updates
      const result = await asUser.mutation(api.yjs.compactUpdates, {
        documentId: docId,
        mergedUpdate: "mergedUpdate",
        newStateVector: "compactedStateVector",
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe(2);

      // Verify updates were compacted
      const state = await asUser.query(api.yjs.getDocumentState, {
        documentId: docId,
      });

      expect(state.updates).toEqual(["mergedUpdate"]);
      expect(state.stateVector).toBe("compactedStateVector");
    });
  });

  describe("updateAwareness", () => {
    it("should create new awareness record", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      const result = await asUser.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 12345,
        awarenessData: JSON.stringify({ cursor: { line: 1, column: 5 } }),
      });

      expect(result.success).toBe(true);
    });

    it("should update existing awareness record", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create initial awareness
      await asUser.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 12345,
        awarenessData: JSON.stringify({ cursor: { line: 1, column: 5 } }),
      });

      // Update awareness
      const result = await asUser.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 12345,
        awarenessData: JSON.stringify({ cursor: { line: 10, column: 20 } }),
      });

      expect(result.success).toBe(true);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId } = await createTestContext(t);

      const docId = await createDocumentInOrganization(t, userId, organizationId, {
        title: "Test Doc",
      });

      await expect(async () => {
        await t.mutation(api.yjs.updateAwareness, {
          documentId: docId,
          clientId: 12345,
          awarenessData: "{}",
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("getAwareness", () => {
    it("should return active awareness states", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser, userId } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: true,
        organizationId,
      });

      // Create awareness
      await asUser.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 12345,
        awarenessData: JSON.stringify({ cursor: { line: 1, column: 5 } }),
      });

      // Get awareness
      const awareness = await asUser.query(api.yjs.getAwareness, {
        documentId: docId,
      });

      expect(awareness).toHaveLength(1);
      expect(awareness[0].userId).toBe(userId);
      expect(awareness[0].clientId).toBe(12345);
      expect(awareness[0].isCurrentUser).toBe(true);
    });

    it("should return multiple users' awareness", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create organization with user1 as owner
      const { organizationId } = await t.run(async (ctx) => {
        const orgId = await ctx.db.insert("organizations", {
          name: "Test Org",
          slug: `test-org-${Date.now()}`,
          createdBy: user1,
          timezone: "America/New_York",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: false,
          },
          updatedAt: Date.now(),
        });

        // Add both users as members
        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: user1,
          role: "owner",
          addedBy: user1,
        });

        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: user2,
          role: "member",
          addedBy: user1,
        });

        return { organizationId: orgId };
      });

      const asUser1 = asAuthenticatedUser(t, user1);
      const asUser2 = asAuthenticatedUser(t, user2);

      // Create public document
      const { documentId: docId } = await asUser1.mutation(api.documents.create, {
        title: "Shared Doc",
        isPublic: true,
        organizationId,
      });

      // Both users update their awareness
      await asUser1.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 111,
        awarenessData: JSON.stringify({ cursor: { line: 1, column: 1 } }),
      });

      await asUser2.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 222,
        awarenessData: JSON.stringify({ cursor: { line: 5, column: 10 } }),
      });

      // User 1 gets awareness - should see both
      const awareness = await asUser1.query(api.yjs.getAwareness, {
        documentId: docId,
      });

      expect(awareness).toHaveLength(2);

      const user1Awareness = awareness.find((a) => a.clientId === 111);
      const user2Awareness = awareness.find((a) => a.clientId === 222);

      expect(user1Awareness?.isCurrentUser).toBe(true);
      expect(user2Awareness?.isCurrentUser).toBe(false);
    });
  });

  describe("removeAwareness", () => {
    it("should remove awareness record", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create awareness
      await asUser.mutation(api.yjs.updateAwareness, {
        documentId: docId,
        clientId: 12345,
        awarenessData: "{}",
      });

      // Verify it exists
      let awareness = await asUser.query(api.yjs.getAwareness, {
        documentId: docId,
      });
      expect(awareness).toHaveLength(1);

      // Remove awareness
      const result = await asUser.mutation(api.yjs.removeAwareness, {
        documentId: docId,
      });
      expect(result.success).toBe(true);

      // Verify it's gone
      awareness = await asUser.query(api.yjs.getAwareness, {
        documentId: docId,
      });
      expect(awareness).toHaveLength(0);
    });

    it("should succeed even if no awareness exists", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Remove non-existent awareness
      const result = await asUser.mutation(api.yjs.removeAwareness, {
        documentId: docId,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("cleanupStaleAwareness", () => {
    it("should remove old awareness records", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      const { documentId: docId } = await asUser.mutation(api.documents.create, {
        title: "Test Doc",
        isPublic: false,
        organizationId,
      });

      // Create an old awareness record directly in db
      await t.run(async (ctx) => {
        await ctx.db.insert("yjsAwareness", {
          documentId: docId,
          userId,
          clientId: 12345,
          awarenessData: "{}",
          lastSeenAt: Date.now() - 2 * MINUTE, // 2 minutes ago (stale)
        });
      });

      // Verify it exists
      let records = await t.run(async (ctx) => {
        return await ctx.db
          .query("yjsAwareness")
          .withIndex("by_document", (q) => q.eq("documentId", docId))
          .collect();
      });
      expect(records).toHaveLength(1);

      // Run cleanup
      const result = await t.mutation(internal.yjs.cleanupStaleAwareness, {});
      expect(result.deleted).toBeGreaterThanOrEqual(1);

      // Verify it's gone
      records = await t.run(async (ctx) => {
        return await ctx.db
          .query("yjsAwareness")
          .withIndex("by_document", (q) => q.eq("documentId", docId))
          .collect();
      });
      expect(records).toHaveLength(0);
    });
  });
});
