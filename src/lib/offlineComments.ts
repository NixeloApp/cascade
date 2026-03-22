import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const COMMENT_ADD_OFFLINE_MUTATION_TYPE = "issues.addComment";

export type AddCommentArgs = FunctionArgs<typeof api.issues.addComment>;

function isAddCommentArgs(value: unknown): value is AddCommentArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.issueId === "string" && typeof obj.content === "string";
}

function validateAddCommentArgs(args: Record<string, unknown>): AddCommentArgs {
  if (!isAddCommentArgs(args)) {
    throw new Error("Invalid issues.addComment args: expected { issueId, content }");
  }
  return args;
}

/** Queues a comment creation to IndexedDB for offline replay. */
export async function queueAddComment(
  args: AddCommentArgs,
  userId?: string,
): Promise<number> {
  return queueOfflineMutation(COMMENT_ADD_OFFLINE_MUTATION_TYPE, args, userId);
}

/** Replays a queued comment through the live Convex client. */
export async function replayAddComment(
  client: ConvexReactClient,
  args: Record<string, unknown>,
): Promise<void> {
  const validated = validateAddCommentArgs(args);
  // Skip attachments for offline replay — file uploads can't be queued.
  await client.mutation(api.issues.addComment, {
    issueId: validated.issueId,
    content: validated.content,
    mentions: validated.mentions,
  });
}
