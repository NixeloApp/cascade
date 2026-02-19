import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import {
  Archive,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Trash2,
} from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Stack } from "./ui/Stack";

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
    <Stack gap="sm">
      <Typography variant="label">Attachments ({attachmentIds.length})</Typography>
      <Stack gap="sm">
        {attachmentIds.map((storageId) => (
          <AttachmentItem
            key={storageId}
            storageId={storageId}
            canEdit={canEdit}
            onRemove={() => handleRemove(storageId)}
          />
        ))}
      </Stack>
    </Stack>
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
      <Card padding="sm" variant="soft">
        <Flex align="center" gap="sm">
          <Skeleton className="size-8" />
          <FlexItem flex="1">
            <Skeleton className="h-4 w-full" />
          </FlexItem>
        </Flex>
      </Card>
    );
  }

  const filename = getFilenameFromUrl(url);
  const fileIcon = getFileIcon(filename);

  return (
    <Card
      padding="sm"
      className="bg-ui-bg-soft hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default group"
    >
      <Flex align="center" gap="sm">
        <Icon icon={fileIcon} size="lg" />
        <FlexItem flex="1" className="min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ui-text hover:text-brand hover:underline truncate block transition-colors duration-default"
          >
            {filename}
          </a>
        </FlexItem>
        <Flex
          gap="xs"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-default"
        >
          <Tooltip content="Download attachment">
            <Button variant="ghost" size="sm" asChild>
              <a href={url} download aria-label="Download attachment">
                <Icon icon={Download} size="sm" />
              </a>
            </Button>
          </Tooltip>
          {canEdit && (
            <Tooltip content="Remove attachment">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                aria-label="Remove attachment"
                className="hover:text-status-error hover:bg-status-error-bg"
              >
                <Icon icon={Trash2} size="sm" />
              </Button>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </Card>
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
