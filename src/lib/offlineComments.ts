import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const COMMENT_ADD_OFFLINE_MUTATION_TYPE = "issues.addComment";
const COMMENT_CLIENT_REQUEST_ID_PREFIX = "issue-comment";

export type AddCommentArgs = FunctionArgs<typeof api.issues.addComment>;

/** Type guard for queued `issues.addComment` replay payloads. */
export function isAddCommentArgs(value: unknown): value is AddCommentArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.issueId === "string" &&
    typeof obj.content === "string" &&
    (obj.clientRequestId === undefined || typeof obj.clientRequestId === "string")
  );
}

/** Parses a queued `issues.addComment` payload, returning `null` when invalid. */
export function parseAddCommentArgs(value: unknown): AddCommentArgs | null {
  return isAddCommentArgs(value) ? value : null;
}

function validateAddCommentArgs(args: Record<string, unknown>): AddCommentArgs {
  if (!isAddCommentArgs(args)) {
    throw new Error("Invalid issues.addComment args: expected { issueId, content }");
  }
  return args;
}

function createCommentRequestEntropy(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Creates a stable client-side request ID for live and replayed comment creation. */
export function createCommentClientRequestId(): string {
  return `${COMMENT_CLIENT_REQUEST_ID_PREFIX}:${createCommentRequestEntropy()}`;
}

/** Queues a comment creation to IndexedDB for offline replay. */
export async function queueAddComment(args: AddCommentArgs, userId?: string): Promise<number> {
  return queueOfflineMutation(COMMENT_ADD_OFFLINE_MUTATION_TYPE, args, userId);
}

/** Replays a queued comment through the live Convex client. */
export async function replayAddComment(
  client: Pick<ConvexReactClient, "mutation">,
  args: Record<string, unknown>,
): Promise<void> {
  const validated = validateAddCommentArgs(args);
  // Skip attachments for offline replay — file uploads can't be queued.
  await client.mutation(api.issues.addComment, {
    issueId: validated.issueId,
    content: validated.content,
    mentions: validated.mentions,
    clientRequestId: validated.clientRequestId,
  });
}
