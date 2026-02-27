import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
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
import { Button, buttonVariants } from "./ui/Button";
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

export function FileAttachments({ issueId }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"_storage"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useQuery(api.files.getIssueAttachments, { issueId });
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addAttachment = useMutation(api.files.addAttachment);
  const removeAttachment = useMutation(api.files.removeAttachment);
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

  const _formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <Button
        variant="unstyled"
        aria-label="File upload area. Drag and drop files here, or click to browse."
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full h-auto border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors duration-default cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
          dragOver
            ? "border-brand bg-ui-bg-hover"
            : "border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-hover",
        )}
      >
        <Icon icon={Paperclip} size="xl" className="mx-auto text-ui-text-tertiary" />
        <Typography variant="muted">Drag and drop files here, or click to browse</Typography>
        <div
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "pointer-events-none",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              Uploading...
            </>
          ) : (
            "Choose Files"
          )}
        </div>
      </Button>

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
                  className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
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
