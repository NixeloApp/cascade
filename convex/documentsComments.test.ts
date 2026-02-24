import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Document Comments", () => {
  it("should soft delete comment and return envelope", async () => {
    const t = convexTest(schema, modules);
    const { userId, organizationId, asUser } = await createTestContext(t);

    // 1. Create a document
    const { documentId: docId } = await asUser.mutation(api.documents.create, {
      title: "Test Document",
      isPublic: false,
      organizationId,
    });

    // 2. Add a comment
    const { commentId } = await asUser.mutation(api.documents.addComment, {
      documentId: docId,
      content: "This is a comment",
    });

    // 3. Delete the comment
    const result = await asUser.mutation(api.documents.deleteComment, {
      commentId,
    });

    // 4. Verify return value
    expect(result).toEqual({ success: true, deleted: true });

    // 5. Verify deletion
    const comments = await asUser.query(api.documents.listComments, {
      documentId: docId,
    });
    expect(comments).toHaveLength(0);
  });
});
