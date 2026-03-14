/**
 * Attachment List
 *
 * Displays file attachments for issues with download and delete actions.
 * Shows file icons based on MIME type with size and upload info.
 * Supports skeleton loading states and empty state messaging.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Archive, File, FileImage, FileSpreadsheet, FileText, Paperclip } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { AttachmentRow } from "./ui/AttachmentRow";
import { Flex, FlexItem } from "./ui/Flex";
import { Stack } from "./ui/Stack";

interface AttachmentListProps {
  attachmentIds: Id<"_storage">[];
  issueId: Id<"issues">;
  canEdit?: boolean;
}

/**
 * Displays list of file attachments with download and delete actions.
 */
export function AttachmentList({ attachmentIds, issueId, canEdit = false }: AttachmentListProps) {
  const { mutate: removeAttachment } = useAuthenticatedMutation(api.attachments.removeAttachment);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<Id<"_storage"> | null>(null);

  const handleRemoveClick = (storageId: Id<"_storage">) => {
    setPendingRemoveId(storageId);
    setRemoveConfirmOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!pendingRemoveId) return;
    try {
      await removeAttachment({ issueId, storageId: pendingRemoveId });
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    } finally {
      setPendingRemoveId(null);
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
            issueId={issueId}
            canEdit={canEdit}
            onRemove={() => handleRemoveClick(storageId)}
          />
        ))}
      </Stack>
      <ConfirmDialog
        isOpen={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={handleRemoveConfirm}
        title="Remove Attachment"
        message="Are you sure you want to remove this attachment?"
        variant="danger"
        confirmLabel="Remove"
      />
    </Stack>
  );
}

function AttachmentItem({
  storageId,
  issueId,
  canEdit,
  onRemove,
}: {
  storageId: Id<"_storage">;
  issueId: Id<"issues">;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const url = useAuthenticatedQuery(api.attachments.getAttachment, { storageId, issueId });

  // Show skeleton while loading (undefined), but handle null (deleted/expired) gracefully
  if (url === undefined) {
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

  // File was deleted or expired - don't render anything
  if (url === null) {
    return null;
  }

  const filename = getFilenameFromUrl(url);
  const fileIcon = getFileIcon(filename);

  return (
    <AttachmentRow
      filename={filename}
      href={url}
      icon={fileIcon}
      linkProps={{
        rel: "noopener noreferrer",
        target: "_blank",
      }}
      downloadLabel="Download attachment"
      deleteLabel={canEdit ? "Remove attachment" : undefined}
      onDelete={canEdit ? onRemove : undefined}
    />
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
