import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queueUserSettingsUpdate, type UserSettingsUpdateArgs } from "@/lib/offlineUserSettings";
import { showInfo } from "@/lib/toast";
import { useOnlineStatus } from "./useOffline";

interface OfflineUserSettingsUpdateOptions {
  allowOfflineQueue?: boolean;
  queuedMessage?: string;
}

interface OfflineUserSettingsUpdateResult {
  queued: boolean;
}

function shouldQueueOfflineUpdate(allowOfflineQueue: boolean, isOnline: boolean): boolean {
  return allowOfflineQueue && !isOnline;
}

async function queueUpdateAndNotify(
  args: UserSettingsUpdateArgs,
  userId: string | undefined,
  queuedMessage?: string,
): Promise<OfflineUserSettingsUpdateResult> {
  if (!userId) {
    throw new Error("Cannot queue offline mutation without an authenticated user");
  }
  await queueUserSettingsUpdate(args, userId);
  if (queuedMessage) {
    showInfo(queuedMessage);
  }
  return { queued: true };
}

/** Mutation wrapper that queues user-settings updates to IndexedDB when offline. */
export function useOfflineUserSettingsUpdate() {
  const isOnline = useOnlineStatus();
  const { mutate, canAct, isAuthLoading } = useAuthenticatedMutation(api.userSettings.update);
  const { user } = useCurrentUser();
  const userId = user?._id;
  const [isUpdating, setIsUpdating] = useState(false);

  const update = async (
    args: UserSettingsUpdateArgs,
    options: OfflineUserSettingsUpdateOptions = {},
  ): Promise<OfflineUserSettingsUpdateResult> => {
    const allowOfflineQueue = options.allowOfflineQueue ?? true;

    if (shouldQueueOfflineUpdate(allowOfflineQueue, isOnline)) {
      return queueUpdateAndNotify(args, userId, options.queuedMessage);
    }

    setIsUpdating(true);
    try {
      await mutate(args);
      return { queued: false };
    } catch (error) {
      // Re-check online status directly via navigator.onLine instead of the
      // hook's isOnline value, which was captured at render time and may be
      // stale if the network dropped mid-flight.
      if (shouldQueueOfflineUpdate(allowOfflineQueue, navigator.onLine)) {
        return queueUpdateAndNotify(args, userId, options.queuedMessage);
      }

      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const isLoading = isUpdating || isAuthLoading;

  return {
    update,
    isOnline,
    isUpdating,
    isLoading,
    canAct,
    isAuthLoading,
  };
}
