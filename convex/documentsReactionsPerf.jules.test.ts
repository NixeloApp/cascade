import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

test("getCommentReactions fetches reactions for multiple comments correctly", async () => {
  const t = convexTest(schema, modules);

  // 1. Setup User and Org
  const userId = await createTestUser(t, { name: "User" });
  const { organizationId } = await createOrganizationAdmin(t, userId);
  const user = asAuthenticatedUser(t, userId);

  // 2. Create Document
  const documentId = await user.mutation(api.documents.create, {
    title: "Test Doc",
    organizationId,
    isPublic: false,
  });

  // 3. Add multiple comments
  const commentIds: Id<"documentComments">[] = [];
  for (let i = 0; i < 5; i++) {
    const commentId = await user.mutation(api.documents.addComment, {
      documentId,
      content: `Comment ${i}`,
    });
    commentIds.push(commentId);
  }

  // 4. Add reactions
  // Comment 0: 👍
  await user.mutation(api.documents.addCommentReaction, {
    commentId: commentIds[0],
    emoji: "👍",
  });
  // Comment 1: 👍, ❤️
  await user.mutation(api.documents.addCommentReaction, {
    commentId: commentIds[1],
    emoji: "👍",
  });
  await user.mutation(api.documents.addCommentReaction, {
    commentId: commentIds[1],
    emoji: "❤️",
  });
  // Comment 2: none
  // Comment 3: 😂
  await user.mutation(api.documents.addCommentReaction, {
    commentId: commentIds[3],
    emoji: "😂",
  });

  // 5. Fetch reactions
  const reactions = await user.query(api.documents.getCommentReactions, {
    commentIds,
  });

  // 6. Verify results
  expect(reactions).toBeDefined();

  // Check Comment 0
  expect(reactions[commentIds[0]]).toHaveLength(1);
  expect(reactions[commentIds[0]][0].emoji).toBe("👍");
  expect(reactions[commentIds[0]][0].count).toBe(1);
  expect(reactions[commentIds[0]][0].hasReacted).toBe(true);

  // Check Comment 1
  expect(reactions[commentIds[1]]).toHaveLength(2);
  const comment1Reactions = reactions[commentIds[1]];
  const emojis1 = comment1Reactions.map((r) => r.emoji).sort();
  expect(emojis1).toEqual(["❤️", "👍"]);
  // Verify count and hasReacted for each reaction
  for (const reaction of comment1Reactions) {
    expect(reaction.count).toBe(1);
    expect(reaction.hasReacted).toBe(true);
  }

  // Check Comment 2 (empty)
  expect(reactions[commentIds[2]]).toHaveLength(0);

  // Check Comment 3
  expect(reactions[commentIds[3]]).toHaveLength(1);
  expect(reactions[commentIds[3]][0].emoji).toBe("😂");

  // Check Comment 4 (empty)
  expect(reactions[commentIds[4]]).toHaveLength(0);
});
