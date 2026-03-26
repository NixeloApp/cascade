import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCommentClientRequestId,
  parseAddCommentArgs,
  replayAddComment,
} from "./offlineComments";

describe("offlineComments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a prefixed client request ID from crypto.randomUUID", () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(createCommentClientRequestId()).toBe(
      "issue-comment:123e4567-e89b-12d3-a456-426614174000",
    );
  });

  it("replays queued comments with the client request ID for server deduplication", async () => {
    const mutation = vi.fn(() => Promise.resolve({ commentId: "comment-1" }));
    const client: Pick<ConvexReactClient, "mutation"> = {
      mutation,
    };

    await replayAddComment(client, {
      issueId: "issue-123",
      content: "Queued comment",
      mentions: ["user-1"],
      attachments: ["storage-1"],
      clientRequestId: "issue-comment:dedup-1",
    });

    expect(mutation).toHaveBeenCalledWith(api.issues.addComment, {
      issueId: "issue-123",
      content: "Queued comment",
      mentions: ["user-1"],
      attachments: ["storage-1"],
      clientRequestId: "issue-comment:dedup-1",
    });
  });

  it("rejects queued payloads with malformed mentions", () => {
    expect(
      parseAddCommentArgs({
        issueId: "issue-123",
        content: "Queued comment",
        mentions: ["user-1", 7],
      }),
    ).toBeNull();
  });

  it("rejects queued payloads with malformed attachments", () => {
    expect(
      parseAddCommentArgs({
        issueId: "issue-123",
        content: "Queued comment",
        attachments: ["storage-1", 7],
      }),
    ).toBeNull();
  });

  it("rejects queued payloads with blank client request IDs", () => {
    expect(
      parseAddCommentArgs({
        issueId: "issue-123",
        content: "Queued comment",
        clientRequestId: "   ",
      }),
    ).toBeNull();
  });
});
