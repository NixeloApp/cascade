/**
 * Avatar Upload Modal
 *
 * Modal for uploading and previewing user avatar images.
 */

import { api } from "@convex/_generated/api";
import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";

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

  const { mutate: generateUploadUrl } = useAuthenticatedMutation(api.files.generateUploadUrl);
  const { mutate: uploadAvatar } = useAuthenticatedMutation(api.users.uploadAvatar);
  const { mutate: removeAvatar } = useAuthenticatedMutation(api.users.removeAvatar);

  const handleFileSelect = (file: File) => {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

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
          <Card padding="none" variant="ghost" className="relative">
            <Avatar
              name={userName}
              email={userEmail}
              src={displayImage}
              size="xl"
              className="w-32 h-32"
            />
            {displayImage && (
              <IconButton
                variant="solid"
                size="sm"
                className="absolute -bottom-1 -right-1"
                onClick={() => fileInputRef.current?.click()}
                tooltip="Choose another avatar"
              >
                <Camera className="h-4 w-4" />
              </IconButton>
            )}
          </Card>
        </Flex>

        <ImageUploadDropzone
          acceptedTypes={ACCEPTED_TYPES}
          fileInputRef={fileInputRef}
          helperText="JPG, PNG, GIF or WebP."
          isDragging={isDragging}
          maxSizeLabel={`${MAX_SIZE_MB}MB`}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onInputChange={handleInputChange}
        />

        {/* Selected file info */}
        {selectedFile && (
          <Card padding="sm" variant="flat">
            <Flex align="center" justify="between" gap="sm">
              <Typography variant="small" className="truncate">
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="secondary">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </Typography>
            </Flex>
          </Card>
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
