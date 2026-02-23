import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Documents Security - Parent Access Control", () => {
  it("should prevent creating a document as a child of a private document owned by another user", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Owner and Organization
    const ownerId = await createTestUser(t, { name: "Owner" });
    const { organizationId } = await createOrganizationAdmin(t, ownerId);
    const asOwner = asAuthenticatedUser(t, ownerId);

    // 2. Setup Attacker (Member of Organization)
    const attackerId = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: attackerId,
        role: "member",
        addedBy: ownerId,
      });
    });

    // 3. Owner creates a PRIVATE document
    const { documentId: parentId } = await asOwner.mutation(api.documents.create, {
      title: "Secret Parent Document",
      isPublic: false,
      organizationId,
    });

    // 4. Attacker tries to create a child document under Owner's private document
    // EXPECTED: Should fail because Attacker cannot access Parent
    // CURRENTLY: Fails only if we fix it. Otherwise succeeds.
    await expect(async () => {
      await asAttacker.mutation(api.documents.create, {
        title: "Child Document",
        isPublic: false,
        organizationId,
        parentId,
      });
    }).rejects.toThrow("Not authorized");
  });

  it("should prevent moving a document to be a child of a private document owned by another user", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Owner and Organization
    const ownerId = await createTestUser(t, { name: "Owner" });
    const { organizationId } = await createOrganizationAdmin(t, ownerId);
    const asOwner = asAuthenticatedUser(t, ownerId);

    // 2. Setup Attacker (Member of Organization)
    const attackerId = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: attackerId,
        role: "member",
        addedBy: ownerId,
      });
    });

    // 3. Owner creates a PRIVATE document (Parent)
    const { documentId: parentId } = await asOwner.mutation(api.documents.create, {
      title: "Secret Parent Document",
      isPublic: false,
      organizationId,
    });

    // 4. Attacker creates their own document
    const { documentId: docId } = await asAttacker.mutation(api.documents.create, {
      title: "My Document",
      isPublic: false,
      organizationId,
    });

    // 5. Attacker tries to move their document under Owner's private document
    // EXPECTED: Should fail
    await expect(async () => {
      await asAttacker.mutation(api.documents.moveDocument, {
        id: docId,
        newParentId: parentId,
      });
    }).rejects.toThrow("Not authorized");
  });
});
