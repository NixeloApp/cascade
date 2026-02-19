/**
 * Hook for managing file uploads to Convex storage
 * Handles validation, upload progress, and error states
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { showError, showSuccess } from "../lib/toast";

export interface FileUploadOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Success message (use {filename} placeholder) */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Callback after successful upload */
  onSuccess?: (storageId: string, file: File) => void;
  /** Callback on error */
  onError?: (error: unknown) => void;
}

export interface FileUploadReturn {
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Ref to attach to file input */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Handler for file input change */
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Programmatically trigger file picker */
  openFilePicker: () => void;
  /** Reset the file input */
  reset: () => void;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
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

/**
 * Manage file uploads with validation and Convex storage integration
 *
 * @example
 * const { isUploading, fileInputRef, handleFileSelect, openFilePicker } = useFileUpload({
 *   onSuccess: async (storageId, file) => {
 *     await attachToIssue({ issueId, storageId, filename: file.name });
 *   },
 * });
 *
 * // In JSX:
 * <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
 * <Button onClick={openFilePicker} disabled={isUploading}>
 *   {isUploading ? "Uploading..." : "Upload"}
 * </Button>
 */
export function useFileUpload(options: FileUploadOptions = {}): FileUploadReturn {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    successMessage = 'File "{filename}" uploaded successfully',
    errorMessage = "Failed to upload file",
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);

  const reset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      showError(`File is too large. Maximum size is ${maxMB}MB.`);
      return;
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      showError("File type not supported.");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };

      // Step 3: Call success callback
      await onSuccess?.(storageId, file);

      showSuccess(successMessage.replace("{filename}", file.name));
      reset();
    } catch (error) {
      showError(error, errorMessage);
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    fileInputRef,
    handleFileSelect,
    openFilePicker,
    reset,
  };
}
