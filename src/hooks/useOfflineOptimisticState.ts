import type { Id } from "@convex/_generated/dataModel";
import { useMemo } from "react";
import type { OfflineMutation } from "@/lib/offline";
import {
  type AddCommentArgs,
  COMMENT_ADD_OFFLINE_MUTATION_TYPE,
  parseAddCommentArgs,
} from "@/lib/offlineComments";
import {
  ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE,
  type IssueUpdateStatusArgs,
  parseIssueUpdateStatusArgs,
} from "@/lib/offlineIssues";
import {
  NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE,
  parseNotificationMarkAsReadArgs,
} from "@/lib/offlineNotifications";
import { useOfflineQueue } from "./useOffline";

interface ParsedOfflineMutation<TArgs> {
  args: TArgs;
  mutationId?: number;
  timestamp: number;
}

export interface QueuedOfflineIssueComment {
  content: string;
  issueId: Id<"issues">;
  key: string;
  mentions?: Id<"users">[];
  timestamp: number;
}

function isPendingOfflineMutation(
  mutation: OfflineMutation,
  mutationType: string,
  userId?: string,
) {
  if (mutation.mutationType !== mutationType) {
    return false;
  }

  if (mutation.status !== "pending" && mutation.status !== "syncing") {
    return false;
  }

  if (userId === undefined || mutation.userId === undefined) {
    return false;
  }

  return mutation.userId === userId;
}

function parseOfflineMutationArgs<TArgs>(
  mutation: OfflineMutation,
  parse: (value: unknown) => TArgs | null,
): ParsedOfflineMutation<TArgs> | null {
  try {
    const parsed = parse(JSON.parse(mutation.mutationArgs));
    if (!parsed) {
      return null;
    }

    return {
      args: parsed,
      mutationId: mutation.id,
      timestamp: mutation.timestamp,
    };
  } catch {
    return null;
  }
}

/** Returns queued comments for the current issue so they can render before replay finishes. */
export function useQueuedOfflineIssueComments(
  issueId: Id<"issues">,
  userId?: Id<"users">,
): QueuedOfflineIssueComment[] {
  const { queue } = useOfflineQueue();

  return useMemo(() => {
    return queue
      .filter((mutation) =>
        isPendingOfflineMutation(mutation, COMMENT_ADD_OFFLINE_MUTATION_TYPE, userId),
      )
      .map((mutation) => parseOfflineMutationArgs(mutation, parseAddCommentArgs))
      .filter((mutation): mutation is ParsedOfflineMutation<AddCommentArgs> => mutation !== null)
      .filter((mutation) => mutation.args.issueId === issueId)
      .sort((left, right) => left.timestamp - right.timestamp)
      .map((mutation) => ({
        content: mutation.args.content,
        issueId: mutation.args.issueId,
        key:
          mutation.args.clientRequestId ??
          `queued-comment-${mutation.mutationId ?? mutation.timestamp}`,
        mentions: mutation.args.mentions,
        timestamp: mutation.timestamp,
      }));
  }, [issueId, queue, userId]);
}

/** Returns queued notification ids that should already look read in the UI. */
export function useQueuedOfflineNotificationReadIds(
  userId?: Id<"users">,
): ReadonlySet<Id<"notifications">> {
  const { queue } = useOfflineQueue();

  return useMemo(() => {
    const queuedReadIds = new Set<Id<"notifications">>();

    for (const mutation of queue) {
      if (
        !isPendingOfflineMutation(mutation, NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE, userId)
      ) {
        continue;
      }

      const parsed = parseOfflineMutationArgs(mutation, parseNotificationMarkAsReadArgs);
      if (!parsed) {
        continue;
      }

      queuedReadIds.add(parsed.args.id);
    }

    return queuedReadIds;
  }, [queue, userId]);
}

/** Returns the latest queued status override for an issue while replay is pending. */
export function useQueuedOfflineIssueStatus(
  issueId: Id<"issues">,
  userId?: Id<"users">,
): IssueUpdateStatusArgs["newStatus"] | null {
  const { queue } = useOfflineQueue();

  return useMemo(() => {
    let latestStatus: ParsedOfflineMutation<IssueUpdateStatusArgs> | null = null;

    for (const mutation of queue) {
      if (!isPendingOfflineMutation(mutation, ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE, userId)) {
        continue;
      }

      const parsed = parseOfflineMutationArgs(mutation, parseIssueUpdateStatusArgs);
      if (!parsed || parsed.args.issueId !== issueId) {
        continue;
      }

      if (!latestStatus || parsed.timestamp > latestStatus.timestamp) {
        latestStatus = parsed;
      }
    }

    return latestStatus?.args.newStatus ?? null;
  }, [issueId, queue, userId]);
}
