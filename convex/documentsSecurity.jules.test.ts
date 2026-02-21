import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Documents Security - Private Project Isolation", () => {
  it("should prevent accessing 'public' documents in a private project if user is not a project member", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup Admin, Organization, and Private Project
    const adminId = await createTestUser(t, { name: "Admin" });
    const { organizationId } = await createOrganizationAdmin(t, adminId);
    const asAdmin = asAuthenticatedUser(t, adminId);

    const privateProjectId = await createProjectInOrganization(t, adminId, organizationId, {
      name: "Private Project",
      isPublic: false,
    });

    // 2. Admin creates a "Public" document in the Private Project
    // (Intended to be shared with project members, but currently leaks to Org)
    const docId = await asAdmin.mutation(api.documents.create, {
      title: "Secret Launch Plan",
      isPublic: true,
      organizationId,
      projectId: privateProjectId,
    });

    // 3. Setup Attacker (Member of Organization, but NOT Project)
    const attackerId = await createTestUser(t, { name: "Attacker" });
    const asAttacker = asAuthenticatedUser(t, attackerId);

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: attackerId,
        role: "member",
        addedBy: adminId,
      });
    });

    // Positive control: admin (project member) should still be able to access
    const docForAdmin = await asAdmin.query(api.documents.getDocument, { id: docId });
    expect(docForAdmin?._id).toBe(docId);

    const adminListResult = await asAdmin.query(api.documents.list, { organizationId });
    const adminDoc = adminListResult.documents.find((d) => d._id === docId);
    expect(adminDoc).toBeDefined();

    // 4. Vulnerability Check 1: getDocument
    // Attacker should NOT be able to see the document because they are not in the project
    await expect(async () => {
      await asAttacker.query(api.documents.getDocument, { id: docId });
    }).rejects.toThrow("Not authorized to access this document");

    // 5. Vulnerability Check 2: list
    // Attacker should NOT see the document in the list
    const listResult = await asAttacker.query(api.documents.list, { organizationId });
    const leakedDoc = listResult.documents.find((d) => d._id === docId);
    expect(leakedDoc).toBeUndefined();
  });
});

describe("Documents Security - Access Revocation", () => {
  it("should prevent updating comments after losing document access", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const member = await createTestUser(t, { name: "Member" });
    const { organizationId } = await createOrganizationAdmin(t, owner);

    const asOwner = asAuthenticatedUser(t, owner);

    // Add member to organization
    await asOwner.mutation(api.organizations.addMember, {
      organizationId,
      userId: member,
      role: "member",
    });

    // Create a document
    const docId = await asOwner.mutation(api.documents.create, {
      title: "Team Document",
      isPublic: true,
      organizationId,
    });

    // Member adds a comment
    const asMember = asAuthenticatedUser(t, member);
    const commentId = await asMember.mutation(api.documents.addComment, {
      documentId: docId,
      content: "Initial comment",
    });

    // Remove member from organization
    await asOwner.mutation(api.organizations.removeMember, {
      organizationId,
      userId: member,
    });

    // Member tries to update their comment
    // EXPECTED: Should fail because they no longer have access to the document
    await expect(async () => {
      await asMember.mutation(api.documents.updateComment, {
        commentId,
        content: "Updated content",
      });
    }).rejects.toThrow("Not authorized");
  });

  it("should prevent deleting comments after losing document access", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const member = await createTestUser(t, { name: "Member" });
    const { organizationId } = await createOrganizationAdmin(t, owner);

    const asOwner = asAuthenticatedUser(t, owner);

    // Add member to organization
    await asOwner.mutation(api.organizations.addMember, {
      organizationId,
      userId: member,
      role: "member",
    });

    // Create a document
    const docId = await asOwner.mutation(api.documents.create, {
      title: "Team Document",
      isPublic: true,
      organizationId,
    });

    // Member adds a comment
    const asMember = asAuthenticatedUser(t, member);
    const commentId = await asMember.mutation(api.documents.addComment, {
      documentId: docId,
      content: "To be deleted",
    });

    // Remove member from organization
    await asOwner.mutation(api.organizations.removeMember, {
      organizationId,
      userId: member,
    });

    // Member tries to delete their comment
    // EXPECTED: Should fail
    await expect(async () => {
      await asMember.mutation(api.documents.deleteComment, {
        commentId,
      });
    }).rejects.toThrow("Not authorized");
  });

  it("should prevent adding reactions after losing document access", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const member = await createTestUser(t, { name: "Member" });
    const { organizationId } = await createOrganizationAdmin(t, owner);

    const asOwner = asAuthenticatedUser(t, owner);

    // Add member to organization
    await asOwner.mutation(api.organizations.addMember, {
      organizationId,
      userId: member,
      role: "member",
    });

    // Create a document
    const docId = await asOwner.mutation(api.documents.create, {
      title: "Team Document",
      isPublic: true,
      organizationId,
    });

    // Member adds a comment
    const asMember = asAuthenticatedUser(t, member);
    const commentId = await asMember.mutation(api.documents.addComment, {
      documentId: docId,
      content: "React to me",
    });

    // Remove member from organization
    await asOwner.mutation(api.organizations.removeMember, {
      organizationId,
      userId: member,
    });

    // Member tries to add reaction
    // EXPECTED: Should fail
    await expect(async () => {
      await asMember.mutation(api.documents.addCommentReaction, {
        commentId,
        emoji: "👍",
      });
    }).rejects.toThrow("Not authorized");
  });

  it("should prevent removing reactions after losing document access", async () => {
    const t = convexTest(schema, modules);
    const owner = await createTestUser(t, { name: "Owner" });
    const member = await createTestUser(t, { name: "Member" });
    const { organizationId } = await createOrganizationAdmin(t, owner);

    const asOwner = asAuthenticatedUser(t, owner);

    // Add member to organization
    await asOwner.mutation(api.organizations.addMember, {
      organizationId,
      userId: member,
      role: "member",
    });

    // Create a document
    const docId = await asOwner.mutation(api.documents.create, {
      title: "Team Document",
      isPublic: true,
      organizationId,
    });

    // Member adds a comment and reaction
    const asMember = asAuthenticatedUser(t, member);
    const commentId = await asMember.mutation(api.documents.addComment, {
      documentId: docId,
      content: "React to me",
    });

    await asMember.mutation(api.documents.addCommentReaction, {
      commentId,
      emoji: "👍",
    });

    // Remove member from organization
    await asOwner.mutation(api.organizations.removeMember, {
      organizationId,
      userId: member,
    });

    // Member tries to remove reaction
    // EXPECTED: Should fail
    await expect(async () => {
      await asMember.mutation(api.documents.removeCommentReaction, {
        commentId,
        emoji: "👍",
      });
    }).rejects.toThrow("Not authorized");
  });
});
