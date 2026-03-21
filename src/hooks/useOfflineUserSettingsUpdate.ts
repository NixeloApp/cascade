import { api } from "@convex/_generated/api";
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

function canQueueOfflineReplay(isOnline: boolean): boolean {
  return !isOnline || (typeof navigator !== "undefined" && navigator.onLine === false);
}

function shouldQueueOfflineUpdate(allowOfflineQueue: boolean, isOnline: boolean): boolean {
  return allowOfflineQueue && canQueueOfflineReplay(isOnline);
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

export function useOfflineUserSettingsUpdate() {
  const isOnline = useOnlineStatus();
  const { mutate, canAct, isAuthLoading } = useAuthenticatedMutation(api.userSettings.update);

  const update = async (
    args: UserSettingsUpdateArgs,
    options: OfflineUserSettingsUpdateOptions = {},
  ): Promise<OfflineUserSettingsUpdateResult> => {
    const allowOfflineQueue = options.allowOfflineQueue ?? true;

    if (shouldQueueOfflineUpdate(allowOfflineQueue, isOnline)) {
      return queueUpdateAndNotify(args, options.queuedMessage);
    }

    try {
      await mutate(args);
      return { queued: false };
    } catch (error) {
      if (shouldQueueOfflineUpdate(allowOfflineQueue, isOnline)) {
        return queueUpdateAndNotify(args, options.queuedMessage);
      }

      throw error;
    }
  };

  return {
    update,
    isOnline,
    canAct,
    isAuthLoading,
  };
}
