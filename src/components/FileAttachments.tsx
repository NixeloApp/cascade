/**
 * File Attachments
 *
 * Issue file attachment management component.
 * Handles file upload, download, preview, and deletion.
 * Supports various file types with appropriate icons.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRef, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Archive, FileImage, FileSpreadsheet, FileText, Paperclip } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { AttachmentRow } from "./ui/AttachmentRow";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { FileUploadDropzone } from "./ui/FileUploadDropzone";
import { Metadata, MetadataTimestamp } from "./ui/Metadata";
import { Stack } from "./ui/Stack";
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

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
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
      <FileUploadDropzone
        ariaLabel="File upload area. Drag and drop files here, or click to browse."
        description="Drag and drop files here, or click to browse"
        fileInputRef={fileInputRef}
        helperText="Supports common document, archive, text, and image formats."
        isDragging={dragOver}
        isUploading={uploading}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onInputChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Attachments List */}
      {attachments && attachments.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Attachments ({attachments.length})</Typography>
          {attachments.map((attachment: Attachment) => (
            <AttachmentRow
              key={attachment.storageId}
              filename={attachment.filename}
              href={attachment.url}
              icon={getFileIcon(attachment.filename)}
              linkProps={{ download: attachment.filename }}
              subtitle={
                <Metadata>
                  <MetadataTimestamp date={attachment.uploadedAt} format="absolute" />
                </Metadata>
              }
              downloadLabel={`Download ${attachment.filename}`}
              deleteLabel={`Delete ${attachment.filename}`}
              onDelete={() => setDeleteConfirm(attachment.storageId)}
            />
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
