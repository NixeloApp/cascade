/**
 * Issue Comments
 *
 * Comment thread for issues with pagination and reactions.
 * Supports @mentions, editing, and deletion of comments.
 * Shows author avatars, timestamps, and reaction counts.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
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
  const currentUser = useQuery(api.users.getCurrent);

  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(api.issues.listComments, { issueId }, { initialNumItems: 50 });

  const addComment = useMutation(api.issues.addComment);
  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
  const attachToIssue = useMutation(api.attachments.attachToIssue);
  const removeAttachment = useMutation(api.attachments.removeAttachment);

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
      await addComment({
        issueId,
        content: newComment,
        mentions: mentions.length > 0 ? mentions : undefined,
        attachments:
          commentAttachments.length > 0
            ? commentAttachments.map((attachment) => attachment.storageId)
            : undefined,
      });

      setNewComment("");
      setMentions([]);
      setCommentAttachments([]);
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
              <Card padding="md" key={comment._id} hoverable className="bg-ui-bg-soft">
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
                    <CommentRenderer content={comment.content} />
                    {(comment.attachments?.length || 0) > 0 && (
                      <Stack gap="xs" className="mt-3">
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
              <Card
                key={attachment.storageId}
                padding="sm"
                className="bg-ui-bg-soft border border-ui-border"
              >
                <Flex align="center" justify="between" gap="sm">
                  <Flex align="center" gap="sm" className="min-w-0">
                    <Paperclip className="w-4 h-4 text-ui-text-secondary shrink-0" />
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
                    <X className="w-4 h-4" />
                  </Button>
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
        <Flex justify="between" align="center" gap="sm">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAttachment}
          >
            {isUploadingAttachment ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4 mr-2" />
                Attach File
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!newComment.trim() || isUploadingAttachment}
          >
            Add Comment
          </Button>
        </Flex>
      </Stack>
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
  const url = useQuery(api.attachments.getAttachment, { storageId, issueId });

  if (url === undefined || url === null) {
    return null;
  }

  return (
    <Button variant="link" size="sm" className="h-auto p-0" asChild>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-ui-text-secondary hover:text-brand"
      >
        <Paperclip className="w-3.5 h-3.5" />
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
