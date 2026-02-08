import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { Archive, File, FileImage, FileSpreadsheet, FileText, Paperclip } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Flex } from "./ui/Flex";
import { Icon } from "./ui/Icon";

interface AttachmentListProps {
  attachmentIds: Id<"_storage">[];
  issueId: Id<"issues">;
  canEdit?: boolean;
}

export function AttachmentList({ attachmentIds, issueId, canEdit = false }: AttachmentListProps) {
  const removeAttachment = useMutation(api.attachments.removeAttachment);

  const handleRemove = async (storageId: Id<"_storage">) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;

    try {
      await removeAttachment({ issueId, storageId });
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    }
  };

  if (attachmentIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Typography variant="h4" className="text-sm font-medium text-ui-text">
        Attachments ({attachmentIds.length})
      </Typography>
      <div className="grid grid-cols-1 gap-2">
        {attachmentIds.map((storageId) => (
          <AttachmentItem
            key={storageId}
            storageId={storageId}
            canEdit={canEdit}
            onRemove={() => handleRemove(storageId)}
          />
        ))}
      </div>
    </div>
  );
}

function AttachmentItem({
  storageId,
  canEdit,
  onRemove,
}: {
  storageId: Id<"_storage">;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const url = useQuery(api.attachments.getAttachment, { storageId });

  if (!url) {
    return (
      <Flex
        align="center"
        gap="sm"
        className="p-2.5 bg-ui-bg-soft rounded-lg border border-ui-border"
      >
        <div className="animate-pulse h-8 w-8 bg-ui-bg-tertiary rounded-md" />
        <div className="flex-1 animate-pulse h-4 bg-ui-bg-tertiary rounded-md" />
      </Flex>
    );
  }

  const filename = getFilenameFromUrl(url);
  const fileIcon = getFileIcon(filename);

  return (
    <Flex
      align="center"
      gap="sm"
      className="p-2.5 bg-ui-bg-soft rounded-lg border border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default group"
    >
      <Icon icon={fileIcon} size="lg" />
      <div className="flex-1 min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-ui-text hover:text-brand hover:underline truncate block transition-colors duration-default"
        >
          {filename}
        </a>
      </div>
      <Flex
        gap="xs"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-default"
      >
        <Tooltip content="Download attachment">
          <a
            href={url}
            download
            className="p-1.5 text-ui-text-tertiary hover:text-ui-text rounded-md hover:bg-ui-bg-tertiary transition-colors duration-default"
          >
            <span className="sr-only">Download attachment</span>
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        </Tooltip>
        {canEdit && (
          <Tooltip content="Remove attachment">
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-ui-text-tertiary hover:text-status-error rounded-md hover:bg-status-error-bg transition-colors duration-default"
              aria-label="Remove attachment"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "file");
  } catch {
    return "file";
  }
}

function getFileIcon(filename: string): LucideIcon {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return FileImage;
  }
  if (ext === "pdf") {
    return FileText;
  }
  if (["txt", "md"].includes(ext)) {
    return File;
  }
  if (ext === "zip") {
    return Archive;
  }
  if (["json", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  return Paperclip;
}
