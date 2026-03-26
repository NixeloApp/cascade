import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE = "issues.updateStatus";

export type IssueUpdateStatusArgs = FunctionArgs<typeof api.issues.updateStatus>;

/** Type guard for queued `issues.updateStatus` replay payloads. */
export function isIssueUpdateStatusArgs(value: unknown): value is IssueUpdateStatusArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.issueId === "string" &&
    typeof obj.newStatus === "string" &&
    typeof obj.newOrder === "number"
  );
}

/** Parses a queued `issues.updateStatus` payload, returning `null` when invalid. */
export function parseIssueUpdateStatusArgs(value: unknown): IssueUpdateStatusArgs | null {
  return isIssueUpdateStatusArgs(value) ? value : null;
}

function validateIssueUpdateStatusArgs(args: Record<string, unknown>): IssueUpdateStatusArgs {
  if (!isIssueUpdateStatusArgs(args)) {
    throw new Error(`Invalid issues.updateStatus args: expected { issueId, newStatus, newOrder }`);
  }
  return args;
}

/** Queues an issue status update to IndexedDB for offline replay. */
export async function queueIssueUpdateStatus(
  args: IssueUpdateStatusArgs,
  userId?: string,
): Promise<number> {
  return queueOfflineMutation(ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE, args, userId);
}

/** Replays a queued issue status update through the live Convex client. */
export async function replayIssueUpdateStatus(
  client: ConvexReactClient,
  args: Record<string, unknown>,
): Promise<void> {
  const validated = validateIssueUpdateStatusArgs(args);
  // Skip optimistic lock for offline replay — version will have changed.
  // Use newOrder: 0 to place at top of column if order is stale.
  await client.mutation(api.issues.updateStatus, {
    ...validated,
    expectedVersion: undefined,
    newOrder: 0,
  });
}
