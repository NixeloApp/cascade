import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { formatRelativeTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { CommentReactions } from "./CommentReactions";
import { CommentRenderer } from "./CommentRenderer";
import { MentionInput } from "./MentionInput";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface IssueCommentsProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueComments({ issueId, projectId }: IssueCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useQuery(api.users.getCurrent);

  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(api.issues.listComments, { issueId }, { initialNumItems: 50 });

  const addComment = useMutation(api.issues.addComment);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({
        issueId,
        content: newComment,
        mentions: mentions.length > 0 ? mentions : undefined,
      });

      setNewComment("");
      setMentions([]);
      showSuccess("Comment added");
    } catch (error) {
      showError(error, "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <Card padding="lg" className="text-center">
        <Typography color="secondary">Loading comments...</Typography>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      {/* Comments List */}
      <Stack gap="md">
        {comments?.length === 0 ? (
          <Card variant="flat" padding="lg">
            <Stack align="center" gap="sm">
              <svg
                aria-hidden="true"
                className="w-12 h-12 mx-auto mb-3 text-ui-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <Typography variant="p">No comments yet</Typography>
              <Typography variant="muted">Be the first to comment!</Typography>
            </Stack>
          </Card>
        ) : (
          <>
            {comments?.map((comment) => (
              <Card
                padding="md"
                key={comment._id}
                className="bg-ui-bg-soft transition-colors duration-default hover:border-ui-border-secondary"
              >
                <Flex gap="md">
                  {/* Avatar */}
                  <FlexItem shrink={false}>
                    <Avatar name={comment.author?.name} src={comment.author?.image} size="lg" />
                  </FlexItem>

                  {/* Comment Content */}
                  <FlexItem flex="1" className="min-w-0">
                    {/* Author and Date */}
                    <Flex align="center" gap="sm" className="mb-2">
                      <Typography variant="label">
                        {comment.author?.name || "Unknown User"}
                      </Typography>
                      <Typography as="time" variant="caption" color="tertiary">
                        {formatRelativeTime(comment._creationTime)}
                      </Typography>
                      {comment.updatedAt > comment._creationTime && (
                        <Typography variant="caption" color="tertiary" className="italic">
                          (edited)
                        </Typography>
                      )}
                    </Flex>

                    {/* Comment Text with Mentions */}
                    <CommentRenderer content={comment.content} mentions={comment.mentions} />

                    {/* Comment Reactions */}
                    <CommentReactions
                      commentId={comment._id}
                      reactions={comment.reactions || []}
                      currentUserId={currentUser?._id}
                    />
                  </FlexItem>
                </Flex>
              </Card>
            ))}

            {status === "CanLoadMore" && (
              <Flex justify="center" className="pt-2">
                <Button variant="secondary" onClick={() => loadMore(50)}>
                  Load More Comments
                </Button>
              </Flex>
            )}
            {status === "LoadingMore" && (
              <Typography variant="small" color="tertiary" className="text-center pt-2">
                Loading...
              </Typography>
            )}
          </>
        )}
      </Stack>

      {/* Add Comment */}
      <Stack gap="sm">
        <Typography variant="label">Add Comment</Typography>
        <MentionInput
          projectId={projectId}
          value={newComment}
          onChange={setNewComment}
          onMentionsChange={setMentions}
          placeholder="Add a comment... Type @ to mention someone"
        />
        <Flex justify="end">
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}
