import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
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
  queuedMessage?: string,
): Promise<OfflineUserSettingsUpdateResult> {
  await queueUserSettingsUpdate(args);
  if (queuedMessage) {
    showInfo(queuedMessage);
  }
  return { queued: true };
}

/** Mutation wrapper that queues user-settings updates to IndexedDB when offline. */
export function useOfflineUserSettingsUpdate() {
  const isOnline = useOnlineStatus();
  const { mutate, canAct, isAuthLoading } = useAuthenticatedMutation(api.userSettings.update);
  const [isUpdating, setIsUpdating] = useState(false);

  const update = async (
    args: UserSettingsUpdateArgs,
    options: OfflineUserSettingsUpdateOptions = {},
  ): Promise<OfflineUserSettingsUpdateResult> => {
    const allowOfflineQueue = options.allowOfflineQueue ?? true;

    if (shouldQueueOfflineUpdate(allowOfflineQueue, isOnline)) {
      return queueUpdateAndNotify(args, options.queuedMessage);
    }

    setIsUpdating(true);
    try {
      await mutate(args);
      return { queued: false };
    } catch (error) {
      if (shouldQueueOfflineUpdate(allowOfflineQueue, isOnline)) {
        return queueUpdateAndNotify(args, options.queuedMessage);
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
