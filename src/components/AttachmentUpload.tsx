import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "./ui/Button";

interface AttachmentUploadProps {
  issueId: Id<"issues">;
  onAttached?: () => void;
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

export function AttachmentUpload({ issueId, onAttached }: AttachmentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
  const attachToIssue = useMutation(api.attachments.attachToIssue);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showError("File is too large. Maximum size is 10MB.");
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError("File type not supported. Please upload images, PDFs, text files, or zips.");
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

      const { storageId } = await result.json();

      // Step 3: Attach to issue
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

      showSuccess(`File "${file.name}" attached successfully!`);
      onAttached?.();

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      showError(error, "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Flex inline>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        leftIcon={
          isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-ui-border border-t-brand" />
          ) : (
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )
        }
      >
        {isUploading ? "Uploading..." : "Attach File"}
      </Button>
    </Flex>
  );
}
