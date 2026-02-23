import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Documents Security - Parent Access Control", () => {
  it("should prevent nesting documents under a parent the user cannot access", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin (User A) and Organization
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId } = await createOrganizationAdmin(t, userA);
    const asUserA = asAuthenticatedUser(t, userA);

    // 2. User A creates a PRIVATE document
    const { documentId: parentDocId } = await asUserA.mutation(api.documents.create, {
      title: "Secret Parent Doc",
      isPublic: false,
      organizationId,
    });

    // 3. Setup User B (Member of Organization)
    const userB = await createTestUser(t, { name: "User B" });
    const asUserB = asAuthenticatedUser(t, userB);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // 4. Vulnerability Check: User B tries to create a child document under User A's private doc
    // Expect failure
    await expect(async () => {
      await asUserB.mutation(api.documents.create, {
        title: "Malicious Child Doc",
        isPublic: false,
        organizationId,
        parentId: parentDocId,
      });
    }).rejects.toThrow("Not authorized to access this document");
  });

  it("should prevent moving documents under a parent the user cannot access", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin (User A) and Organization
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId } = await createOrganizationAdmin(t, userA);
    const asUserA = asAuthenticatedUser(t, userA);

    // 2. User A creates a PRIVATE document
    const { documentId: secretParentId } = await asUserA.mutation(api.documents.create, {
      title: "Secret Parent Doc",
      isPublic: false,
      organizationId,
    });

    // 3. Setup User B (Member)
    const userB = await createTestUser(t, { name: "User B" });
    const asUserB = asAuthenticatedUser(t, userB);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: userB,
        role: "member",
        addedBy: userA,
      });
    });

    // 4. User B creates their own document
    const { documentId: myDocId } = await asUserB.mutation(api.documents.create, {
      title: "My Doc",
      isPublic: false,
      organizationId,
    });

    // 5. Vulnerability Check: User B tries to move their doc under secret parent
    // Expect failure
    await expect(async () => {
      await asUserB.mutation(api.documents.moveDocument, {
        id: myDocId,
        newParentId: secretParentId,
      });
    }).rejects.toThrow("Not authorized to access this document");
  });
});
