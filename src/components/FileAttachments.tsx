/**
 * File Attachments
 *
 * Issue file attachment management component.
 * Handles file upload, download, preview, and deletion.
 * Supports various file types with appropriate icons.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  Archive,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Trash2,
} from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { IconButton } from "./ui/IconButton";
import { Metadata, MetadataTimestamp } from "./ui/Metadata";
import { Stack } from "./ui/Stack";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface FileAttachmentsProps {
  issueId: Id<"issues">;
}

/** File attachment manager with drag-drop upload and file listing. */
export function FileAttachments({ issueId }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"_storage"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useAuthenticatedQuery(api.files.getIssueAttachments, { issueId });
  const { mutate: generateUploadUrl } = useAuthenticatedMutation(api.files.generateUploadUrl);
  const { mutate: addAttachment } = useAuthenticatedMutation(api.files.addAttachment);
  const { mutate: removeAttachment } = useAuthenticatedMutation(api.files.removeAttachment);
  // Define type for attachment if not available globally
  interface Attachment {
    storageId: Id<"_storage">;
    filename: string;
    url: string | null;
    uploadedAt: number;
    uploadedBy?: Id<"users">;
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Get upload URL
        const { uploadUrl } = await generateUploadUrl();

        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await result.json();

        // Add to issue
        const attachResult = await addAttachment({
          issueId,
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        if (!attachResult.success) {
          throw new Error(attachResult.error);
        }

        showSuccess(`Uploaded ${file.name}`);
      }
    } catch (error) {
      showError(error, "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUploadAreaKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeAttachment({ issueId, storageId: deleteConfirm });
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
      case "doc":
      case "docx":
        return FileText;
      case "xls":
      case "xlsx":
        return FileSpreadsheet;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return FileImage;
      case "zip":
      case "rar":
        return Archive;
      default:
        return Paperclip;
    }
  };

  return (
    <Stack gap="md">
      {/* Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        id="file-upload"
        tabIndex={-1}
      />
      <Card
        variant="ghost"
        aria-label="File upload area. Drag and drop files here, or click to browse."
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleUploadAreaKeyDown}
        className={cn(
          "w-full h-auto border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors duration-default cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
          dragOver
            ? "border-brand bg-ui-bg-hover"
            : "border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-hover",
        )}
      >
        <Icon icon={Paperclip} size="xl" className="mx-auto text-ui-text-tertiary" />
        <Typography variant="muted">Drag and drop files here, or click to browse</Typography>
        <div className="pointer-events-none" aria-hidden="true">
          <Button variant="secondary" size="sm" type="button" tabIndex={-1}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading...
              </>
            ) : (
              "Choose Files"
            )}
          </Button>
        </div>
      </Card>

      {/* Attachments List */}
      {attachments && attachments.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Attachments ({attachments.length})</Typography>
          {attachments.map((attachment: Attachment) => (
            <Card key={attachment.storageId} padding="sm" hoverable className="bg-ui-bg-soft group">
              <Flex align="center" justify="between">
                <FlexItem flex="1" className="min-w-0">
                  <Flex align="center" gap="md">
                    <Icon icon={getFileIcon(attachment.filename)} size="lg" className="shrink-0" />
                    <FlexItem flex="1" className="min-w-0">
                      {attachment.url ? (
                        <a
                          href={attachment.url}
                          download={attachment.filename}
                          className="hover:text-brand truncate block transition-colors duration-default"
                        >
                          <Typography variant="label" className="truncate">
                            {attachment.filename}
                          </Typography>
                        </a>
                      ) : (
                        <Typography variant="label" color="tertiary" className="truncate">
                          {attachment.filename} (unavailable)
                        </Typography>
                      )}
                      <Metadata>
                        <MetadataTimestamp date={attachment.uploadedAt} format="absolute" />
                      </Metadata>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <Flex
                  align="center"
                  gap="xs"
                  className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                >
                  {attachment.url && (
                    <Tooltip content="Download">
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={attachment.url}
                          download={attachment.filename}
                          aria-label={`Download ${attachment.filename}`}
                        >
                          <Icon icon={Download} size="sm" />
                        </a>
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip content="Delete">
                    <IconButton
                      variant="danger"
                      size="sm"
                      reveal
                      onClick={() => setDeleteConfirm(attachment.storageId)}
                      aria-label={`Delete ${attachment.filename}`}
                    >
                      <Icon icon={Trash2} size="sm" />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Stack>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </Stack>
  );
}
