/**
 * Avatar Upload Modal
 *
 * Modal for uploading and previewing user avatar images.
 */

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Camera, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function AvatarUploadModal({
  open,
  onOpenChange,
  currentImage,
  userName,
  userEmail,
}: AvatarUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadAvatar = useMutation(api.users.uploadAvatar);
  const removeAvatar = useMutation(api.users.removeAvatar);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showError("Please select a JPG, PNG, GIF, or WebP image");
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      showError(`Image must be smaller than ${MAX_SIZE_MB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const { uploadUrl } = await generateUploadUrl({});

      // Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();

      // Update user avatar
      const result = await uploadAvatar({ storageId });

      if (result.success) {
        showSuccess("Avatar updated successfully");
        handleClose();
      } else {
        showError(result.error || "Failed to update avatar");
      }
    } catch (error) {
      showError(error, "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await removeAvatar({});
      showSuccess("Avatar removed");
      handleClose();
    } catch (error) {
      showError(error, "Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setIsDragging(false);
    onOpenChange(false);
  };

  const displayImage = preview || currentImage;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Upload Avatar"
      description="Choose a profile picture to display"
      size="sm"
    >
      <Stack gap="lg">
        {/* Preview */}
        <Flex justify="center">
          <div className="relative">
            <Avatar
              name={userName}
              email={userEmail}
              src={displayImage}
              size="xl"
              className="w-32 h-32"
            />
            {displayImage && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-ui-bg border border-ui-border shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Flex>

        {/* Drop zone - uses div with role="button" because button elements don't support drag-drop properly */}
        {/* biome-ignore lint/a11y/useSemanticElements: Drop zones require div for drag-drop support */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-brand bg-brand-subtle/50"
              : "border-ui-border hover:border-brand/50 hover:bg-ui-bg-hover",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
          <Stack gap="sm" align="center">
            <Upload className="h-8 w-8 text-ui-text-tertiary" />
            <Typography variant="small" color="secondary">
              Drag and drop an image, or click to browse
            </Typography>
            <Typography variant="caption" color="tertiary">
              JPG, PNG, GIF or WebP. Max {MAX_SIZE_MB}MB.
            </Typography>
          </Stack>
        </div>

        {/* Selected file info */}
        {selectedFile && (
          <Flex align="center" justify="between" className="px-2">
            <Typography variant="small" className="truncate">
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="secondary">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </Typography>
          </Flex>
        )}

        {/* Actions */}
        <Flex gap="sm" justify="end">
          {currentImage && !preview && (
            <Button
              variant="ghostDanger"
              onClick={handleRemove}
              disabled={isUploading}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Remove
            </Button>
          )}
          <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
          >
            Upload
          </Button>
        </Flex>
      </Stack>
    </Dialog>
  );
}
