import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { formatRelativeTime } from "@/lib/formatting";
import { MessageCircle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { Textarea } from "./ui/form/Textarea";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

interface DocumentCommentsProps {
  documentId: Id<"documents">;
}

/**
 * Display and manage comments for a document.
 * Nixelo advantage - Plane has no page/document comments!
 */
export function DocumentComments({ documentId }: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = useQuery(api.documents.listComments, { documentId });
  const addComment = useMutation(api.documents.addComment);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({
        documentId,
        content: newComment,
      });

      setNewComment("");
      showSuccess("Comment added");
    } catch (error) {
      showError(error, "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (comments === undefined) {
    return (
      <Flex justify="center" className="py-8">
        <LoadingSpinner size="md" />
      </Flex>
    );
  }

  return (
    <div className="space-y-6">
      <Typography variant="h5">Comments</Typography>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            description="Be the first to comment on this document"
          />
        ) : (
          comments.map((comment) => (
            <Flex
              gap="md"
              className="p-4 bg-ui-bg-soft border border-ui-border rounded-lg transition-colors duration-default hover:border-ui-border-secondary"
              key={comment._id}
            >
              {/* Avatar */}
              <FlexItem shrink={false}>
                <Avatar name={comment.authorName} src={comment.authorImage} size="lg" />
              </FlexItem>

              {/* Comment Content */}
              <FlexItem flex="1" className="min-w-0">
                {/* Author and Date */}
                <Flex align="center" gap="sm" className="mb-2 text-sm">
                  <Typography variant="label">{comment.authorName || "Unknown User"}</Typography>
                  <time
                    className="text-ui-text-tertiary text-xs"
                    dateTime={new Date(comment._creationTime).toISOString()}
                  >
                    {formatRelativeTime(comment._creationTime)}
                  </time>
                  {comment.updatedAt > comment._creationTime && (
                    <Typography variant="caption" color="tertiary" className="italic">
                      (edited)
                    </Typography>
                  )}
                </Flex>

                {/* Comment Text */}
                <Typography variant="p" className="whitespace-pre-wrap">
                  {comment.content}
                </Typography>
              </FlexItem>
            </Flex>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="space-y-3 pt-4 border-t border-ui-border">
        <Typography variant="label">Add Comment</Typography>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <Flex justify="end">
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </Flex>
      </div>
    </div>
  );
}
