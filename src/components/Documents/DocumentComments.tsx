/**
 * Document Comments
 *
 * Comment thread sidebar for documents.
 * Supports nested replies, reactions, and real-time updates.
 * Shows comment authors with avatars and relative timestamps.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Textarea } from "@/components/ui/form/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { MessageCircle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

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

  const comments = useAuthenticatedQuery(api.documents.listComments, { documentId });
  const { mutate: addComment } = useAuthenticatedMutation(api.documents.addComment);

  const handleSubmit = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    setIsSubmitting(true);
    try {
      await addComment({
        documentId,
        content: trimmedComment,
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
      <Card padding="xl" variant="ghost">
        <LoadingSpinner size="md" message="Loading comments..." />
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      <Typography variant="h5">Comments</Typography>

      {/* Comments List */}
      <Stack gap="md">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            description="Be the first to comment on this document"
          />
        ) : (
          comments.map((comment) => (
            <Card key={comment._id} recipe="commentThreadItem" padding="md" hoverable>
              <Flex gap="md">
                {/* Avatar */}
                <FlexItem shrink={false}>
                  <Avatar name={comment.authorName} src={comment.authorImage} size="lg" />
                </FlexItem>

                {/* Comment Content */}
                <FlexItem flex="1" className="min-w-0">
                  {/* Author and Date */}
                  <Metadata size="sm" className="mb-2">
                    <MetadataItem className="text-ui-text">
                      {comment.authorName || "Unknown User"}
                    </MetadataItem>
                    <MetadataTimestamp date={comment._creationTime} />
                    {comment.updatedAt > comment._creationTime && (
                      <Typography variant="caption" color="tertiary" as="span" className="italic">
                        (edited)
                      </Typography>
                    )}
                  </Metadata>

                  {/* Comment Text */}
                  <Typography variant="p" className="whitespace-pre-wrap">
                    {comment.content}
                  </Typography>
                </FlexItem>
              </Flex>
            </Card>
          ))
        )}
      </Stack>

      {/* Add Comment */}
      <Card recipe="documentCommentComposer" padding="md">
        <Stack gap="sm">
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
        </Stack>
      </Card>
    </Stack>
  );
}
