import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { formatRelativeTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { CommentReactions } from "./CommentReactions";
import { CommentRenderer } from "./CommentRenderer";
import { MentionInput } from "./MentionInput";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
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
    return <div className="p-8 text-center">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            description="Be the first to comment!"
          />
        ) : (
          <>
            {comments?.map((comment) => (
              <Flex
                gap="md"
                className="p-4 bg-ui-bg-soft border border-ui-border rounded-lg transition-colors duration-default hover:border-ui-border-secondary"
                key={comment._id}
              >
                {/* Avatar */}
                <FlexItem shrink={false}>
                  <Avatar name={comment.author?.name} src={comment.author?.image} size="lg" />
                </FlexItem>

                {/* Comment Content */}
                <FlexItem flex="1" className="min-w-0">
                  {/* Author and Date */}
                  <Flex align="center" gap="sm" className="mb-2 text-sm">
                    <strong>{comment.author?.name || "Unknown User"}</strong>
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
            ))}

            {status === "CanLoadMore" && (
              <div className="text-center pt-2">
                <Button variant="secondary" onClick={() => loadMore(50)}>
                  Load More Comments
                </Button>
              </div>
            )}
            {status === "LoadingMore" && (
              <Typography variant="small" color="tertiary" className="text-center pt-2">
                Loading...
              </Typography>
            )}
          </>
        )}
      </div>

      {/* Add Comment */}
      <div className="space-y-3">
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
      </div>
    </div>
  );
}
