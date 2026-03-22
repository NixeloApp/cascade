import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queueNotificationMarkAsRead } from "@/lib/offlineNotifications";
import { useOnlineStatus } from "./useOffline";

/** Marks a notification as read, queuing to IndexedDB when offline. */
export function useOfflineNotificationMarkAsRead() {
  const isOnline = useOnlineStatus();
  const { mutate, isAuthLoading } = useAuthenticatedMutation(api.notifications.markAsRead);
  const { user } = useCurrentUser();
  const userId = user?._id;
  const [isMarking, setIsMarking] = useState(false);

  const markAsRead = async (id: Id<"notifications">): Promise<{ queued: boolean }> => {
    if (!isOnline) {
      if (!userId) {
        throw new Error("Cannot queue offline mutation without an authenticated user");
      }
      await queueNotificationMarkAsRead({ id }, userId);
      return { queued: true };
    }

    setIsMarking(true);
    try {
      await mutate({ id });
      return { queued: false };
    } catch (error) {
      if (!navigator.onLine && userId) {
        await queueNotificationMarkAsRead({ id }, userId);
        return { queued: true };
      }
      throw error;
    } finally {
      setIsMarking(false);
    }
  };

  const isLoading = isMarking || isAuthLoading;

  return { markAsRead, isOnline, isLoading };
}
