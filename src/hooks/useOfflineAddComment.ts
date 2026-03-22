import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queueAddComment } from "@/lib/offlineComments";
import { showInfo } from "@/lib/toast";
import { useOnlineStatus } from "./useOffline";

/** Adds a comment to an issue, queuing to IndexedDB when offline. */
export function useOfflineAddComment() {
  const isOnline = useOnlineStatus();
  const { mutate, isAuthLoading } = useAuthenticatedMutation(api.issues.addComment);
  const { user } = useCurrentUser();
  const userId = user?._id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = async (
    issueId: Id<"issues">,
    content: string,
    mentions?: Id<"users">[],
    attachments?: Id<"_storage">[],
  ): Promise<{ queued: boolean; commentId?: Id<"issueComments"> }> => {
    const queueArgs = { issueId, content, mentions };

    if (!isOnline) {
      if (!userId) {
        throw new Error("Cannot queue offline mutation without an authenticated user");
      }
      // Attachments are not supported offline (can't queue file uploads)
      await queueAddComment(queueArgs, userId);
      showInfo("Comment queued — will post when you reconnect");
      return { queued: true };
    }

    setIsSubmitting(true);
    try {
      const result = await mutate({ ...queueArgs, attachments });
      return { queued: false, commentId: result.commentId };
    } catch (error) {
      if (!navigator.onLine && userId) {
        await queueAddComment(queueArgs, userId);
        showInfo("Comment queued — will post when you reconnect");
        return { queued: true };
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isAuthLoading;

  return { addComment, isOnline, isLoading };
}
