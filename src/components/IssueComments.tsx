/**
 * Issue Comments
 *
 * Comment thread for issues with pagination and reactions.
 * Supports @mentions, editing, and deletion of comments.
 * Shows author avatars, timestamps, and reaction counts.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Separator } from "@/components/ui/Separator";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOfflineAddComment } from "@/hooks/useOfflineAddComment";
import { formatRelativeTime } from "@/lib/formatting";
import { MessageCircle, Paperclip, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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

interface PendingAttachment {
  storageId: Id<"_storage">;
  filename: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/json",
];

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large (max 10MB).`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}" has an unsupported file type.`);
  }
}

async function uploadSingleFile(
  file: File,
  issueId: Id<"issues">,
  generateUploadUrl: () => Promise<string>,
  attachToIssue: (args: {
    issueId: Id<"issues">;
    storageId: Id<"_storage">;
    filename: string;
    contentType: string;
    size: number;
  }) => Promise<{ success: boolean; error?: string }>,
): Promise<PendingAttachment> {
  validateFile(file);

  const uploadUrl = await generateUploadUrl();
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed for "${file.name}".`);
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: Id<"_storage"> };
  const attachResult = await attachToIssue({
    issueId,
    storageId,
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });

  if (!attachResult.success) {
    throw new Error(attachResult.error);
  }

  return { storageId, filename: file.name };
}

/** Comment thread for an issue with reactions and mention support. */
export function IssueComments({ issueId, projectId }: IssueCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<Id<"users">[]>([]);
  const [commentAttachments, setCommentAttachments] = useState<PendingAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});

  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(api.issues.listComments, { issueId }, { initialNumItems: 50 });

  const { addComment } = useOfflineAddComment();
  const { mutate: generateUploadUrl } = useAuthenticatedMutation(api.attachments.generateUploadUrl);
  const { mutate: attachToIssue } = useAuthenticatedMutation(api.attachments.attachToIssue);
  const { mutate: removeAttachment } = useAuthenticatedMutation(api.attachments.removeAttachment);

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      const uploadedAttachments = await Promise.all(
        Array.from(files).map((file) =>
          uploadSingleFile(file, issueId, generateUploadUrl, attachToIssue),
        ),
      );

      setCommentAttachments((prev) => [...prev, ...uploadedAttachments]);
      showSuccess(
        uploadedAttachments.length === 1
          ? `Attached "${uploadedAttachments[0].filename}".`
          : `${uploadedAttachments.length} files attached.`,
      );
    } catch (error) {
      showError(error, "Failed to attach file");
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePendingAttachment = async (storageId: Id<"_storage">) => {
    try {
      await removeAttachment({ issueId, storageId });
      setCommentAttachments((prev) =>
        prev.filter((attachment) => attachment.storageId !== storageId),
      );
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addComment(
        issueId,
        newComment,
        mentions.length > 0 ? mentions : undefined,
        commentAttachments.length > 0 ? commentAttachments.map((a) => a.storageId) : undefined,
      );

      setNewComment("");
      setMentions([]);
      setCommentAttachments([]);
      if (!result.queued) {
        showSuccess("Comment added");
      }
    } catch (error) {
      showError(error, "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <Card
        padding="lg"
        variant="flat"
        className="text-center"
        data-testid={TEST_IDS.COMMENTS.LOADING}
      >
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
            <EmptyState
              icon={MessageCircle}
              title="No conversation yet"
              description="Use comments to capture decisions, blockers, and handoff notes."
              size="compact"
              align="start"
              surface="bare"
            />
          </Card>
        ) : (
          <Stack gap="md">
            {comments?.map((comment) => (
              <Flex key={comment._id} gap="md" align="stretch">
                <Stack align="center" gap="sm">
                  <FlexItem shrink={false}>
                    <Avatar name={comment.author?.name} src={comment.author?.image} size="lg" />
                  </FlexItem>
                  <Separator orientation="vertical" className="flex-1" />
                </Stack>

                <Card recipe="commentThreadItem" padding="md" hoverable>
                  <FlexItem flex="1" className="min-w-0">
                    <Stack gap="sm">
                      <Flex align="center" gap="sm">
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

                      <CommentRenderer content={comment.content} />
                      {(comment.attachments?.length || 0) > 0 && (
                        <Stack gap="xs">
                          <Typography variant="caption" color="tertiary">
                            Attachments
                          </Typography>
                          <Stack gap="xs">
                            {comment.attachments?.map((storageId) => (
                              <CommentAttachmentLink
                                key={storageId}
                                issueId={issueId}
                                storageId={storageId}
                              />
                            ))}
                          </Stack>
                        </Stack>
                      )}

                      <CommentReactions
                        commentId={comment._id}
                        reactions={comment.reactions || []}
                        currentUserId={currentUser?._id}
                      />
                    </Stack>
                  </FlexItem>
                </Card>
              </Flex>
            ))}

            {status === "CanLoadMore" && (
              <Flex justify="center">
                <Button variant="secondary" onClick={() => loadMore(50)}>
                  Load More Comments
                </Button>
              </Flex>
            )}
            {status === "LoadingMore" && (
              <Typography variant="small" color="tertiary" className="text-center">
                Loading...
              </Typography>
            )}
          </Stack>
        )}
      </Stack>

      <Card padding="md" variant="flat" data-testid={TEST_IDS.COMMENTS.ADD_BUTTON}>
        <Stack gap="md">
          <Stack gap="xs">
            <Typography variant="label">Add Comment</Typography>
            <Typography variant="small" color="secondary">
              Share context, decisions, or follow-up work without leaving the issue.
            </Typography>
          </Stack>
          <MentionInput
            projectId={projectId}
            value={newComment}
            onChange={setNewComment}
            onMentionsChange={setMentions}
            placeholder="Add a comment... Type @ to mention someone"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(event) => handleAttachmentUpload(event.target.files)}
            disabled={isUploadingAttachment}
          />
          {commentAttachments.length > 0 && (
            <Stack gap="xs">
              {commentAttachments.map((attachment) => (
                <CardSection key={attachment.storageId} size="compact">
                  <Flex align="center" justify="between" gap="sm">
                    <Flex align="center" gap="sm" className="min-w-0">
                      <Icon icon={Paperclip} size="sm" tone="secondary" className="shrink-0" />
                      <Typography variant="small" className="truncate">
                        {attachment.filename}
                      </Typography>
                    </Flex>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePendingAttachment(attachment.storageId)}
                      aria-label={`Remove ${attachment.filename}`}
                    >
                      <Icon icon={X} size="sm" />
                    </Button>
                  </Flex>
                </CardSection>
              ))}
            </Stack>
          )}
          <Flex justify="between" align="center" gap="sm">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAttachment}
              isLoading={isUploadingAttachment}
              leftIcon={!isUploadingAttachment ? <Icon icon={Paperclip} size="sm" /> : undefined}
            >
              {isUploadingAttachment ? "Uploading..." : "Attach File"}
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!newComment.trim() || isUploadingAttachment}
              data-testid={TEST_IDS.COMMENTS.SUBMIT_BUTTON}
            >
              Add Comment
            </Button>
          </Flex>
        </Stack>
      </Card>
    </Stack>
  );
}

function CommentAttachmentLink({
  storageId,
  issueId,
}: {
  storageId: Id<"_storage">;
  issueId: Id<"issues">;
}) {
  const url = useAuthenticatedQuery(api.attachments.getAttachment, { storageId, issueId });

  if (url === undefined || url === null) {
    return null;
  }

  return (
    <Button
      variant="link"
      size="none"
      className="text-ui-text-secondary"
      leftIcon={<Icon icon={Paperclip} size="sm" />}
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {getFilenameFromUrl(url)}
      </a>
    </Button>
  );
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObject = new URL(url);
    const parts = urlObject.pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "file");
  } catch {
    return "file";
  }
}
