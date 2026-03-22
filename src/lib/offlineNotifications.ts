import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { queueOfflineMutation } from "./offline";

export const NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE = "notifications.markAsRead";

export type NotificationMarkAsReadArgs = FunctionArgs<typeof api.notifications.markAsRead>;

function isNotificationMarkAsReadArgs(value: unknown): value is NotificationMarkAsReadArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "string" && Object.keys(obj).length === 1;
}

function validateNotificationMarkAsReadArgs(
  args: Record<string, unknown>,
): NotificationMarkAsReadArgs {
  if (!isNotificationMarkAsReadArgs(args)) {
    throw new Error(
      `Invalid notifications.markAsRead args: expected { id: string }, got ${JSON.stringify(Object.keys(args))}`,
    );
  }
  return args;
}

/** Queues a mark-as-read mutation to IndexedDB for offline replay. */
export async function queueNotificationMarkAsRead(
  args: NotificationMarkAsReadArgs,
  userId?: string,
): Promise<number> {
  return queueOfflineMutation(NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE, args, userId);
}

/** Replays a queued mark-as-read mutation through the live Convex client. */
export async function replayNotificationMarkAsRead(
  client: ConvexReactClient,
  args: Record<string, unknown>,
): Promise<void> {
  const validated = validateNotificationMarkAsReadArgs(args);
  await client.mutation(api.notifications.markAsRead, validated);
}
