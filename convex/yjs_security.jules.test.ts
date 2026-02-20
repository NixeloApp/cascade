import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext } from "./testUtils";

describe("Yjs Security", () => {
  it("should prevent unauthorized users from reading document state", async () => {
    const t = convexTest(schema, modules);

    // User A creates a document
    const { userId: userA, organizationId: orgA } = await createTestContext(t, { name: "User A" });
    const asUserA = asAuthenticatedUser(t, userA);

    const docId = await asUserA.mutation(api.documents.create, {
      title: "Secret Doc",
      isPublic: false,
      organizationId: orgA,
    });

    // User B (unrelated) tries to read it
    const { userId: userB } = await createTestContext(t, { name: "User B" });
    const asUserB = asAuthenticatedUser(t, userB);

    // This should fail
    await expect(async () => {
      await asUserB.query(api.yjs.getDocumentState, {
        documentId: docId,
      });
    }).rejects.toThrow();
  });

  it("should prevent unauthorized users from applying updates", async () => {
    const t = convexTest(schema, modules);

    // User A creates a document
    const { userId: userA, organizationId: orgA } = await createTestContext(t, { name: "User A" });
    const asUserA = asAuthenticatedUser(t, userA);

    const docId = await asUserA.mutation(api.documents.create, {
      title: "Secret Doc",
      isPublic: false,
      organizationId: orgA,
    });

    // User B (unrelated) tries to update it
    const { userId: userB } = await createTestContext(t, { name: "User B" });
    const asUserB = asAuthenticatedUser(t, userB);

    // This should fail
    await expect(async () => {
      await asUserB.mutation(api.yjs.applyUpdates, {
        documentId: docId,
        updates: ["fake-update"],
        clientVersion: 0,
      });
    }).rejects.toThrow();
  });
});
