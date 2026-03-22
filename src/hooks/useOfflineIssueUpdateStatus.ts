import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queueIssueUpdateStatus } from "@/lib/offlineIssues";
import { useOnlineStatus } from "./useOffline";

/** Updates an issue's status, queuing to IndexedDB when offline. */
export function useOfflineIssueUpdateStatus() {
  const isOnline = useOnlineStatus();
  const { mutate, isAuthLoading } = useAuthenticatedMutation(api.issues.updateStatus);
  const { user } = useCurrentUser();
  const userId = user?._id;
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (
    issueId: Id<"issues">,
    newStatus: string,
    newOrder?: number,
  ): Promise<{ queued: boolean }> => {
    const args = { issueId, newStatus, newOrder: newOrder ?? 0 };

    if (!isOnline) {
      if (!userId) {
        throw new Error("Cannot queue offline mutation without an authenticated user");
      }
      await queueIssueUpdateStatus(args, userId);
      return { queued: true };
    }

    setIsUpdating(true);
    try {
      await mutate(args);
      return { queued: false };
    } catch (error) {
      if (!navigator.onLine && userId) {
        await queueIssueUpdateStatus(args, userId);
        return { queued: true };
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const isLoading = isUpdating || isAuthLoading;

  return { updateStatus, isOnline, isLoading };
}
