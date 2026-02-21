
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

test("getCommentReactions leaks reactions for inaccessible documents", async () => {
  const t = convexTest(schema, modules);

  // 1. Setup User A (Owner) and their organization
  const ownerId = await createTestUser(t, { name: "Owner" });
  const { organizationId } = await createOrganizationAdmin(t, ownerId);
  const asOwner = asAuthenticatedUser(t, ownerId);

  // 2. Create a private document
  const documentId = await asOwner.mutation(api.documents.create, {
    title: "Secret Document",
    organizationId,
    isPublic: false,
  });

  // 3. Add a comment and reaction
  const commentId = await asOwner.mutation(api.documents.addComment, {
    documentId,
    content: "Secret comment",
  });

  await asOwner.mutation(api.documents.addCommentReaction, {
    commentId,
    emoji: "👍",
  });

  // 4. Setup User B (Attacker) - unrelated user
  const attackerId = await createTestUser(t, { name: "Attacker" });
  const asAttacker = asAuthenticatedUser(t, attackerId);

  // 5. Attacker tries to get reactions for the comment
  // This should now FAIL with "Not authorized to access this document"
  await expect(async () => {
    await asAttacker.query(api.documents.getCommentReactions, {
      commentIds: [commentId],
    });
  }).rejects.toThrow("Not authorized");
});
