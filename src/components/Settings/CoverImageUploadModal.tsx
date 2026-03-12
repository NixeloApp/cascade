/**
 * Cover Image Upload Modal
 *
 * Modal for uploading and previewing user profile cover images.
 */

import { api } from "@convex/_generated/api";
import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
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

interface CoverImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string | null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function CoverImageUploadModal({
  open,
  onOpenChange,
  currentImage,
}: CoverImageUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: generateUploadUrl } = useAuthenticatedMutation(api.files.generateUploadUrl);
  const { mutate: uploadCoverImage } = useAuthenticatedMutation(api.users.uploadCoverImage);
  const { mutate: removeCoverImage } = useAuthenticatedMutation(api.users.removeCoverImage);

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

      // Update user cover image
      const result = await uploadCoverImage({ storageId });

      if (result.success) {
        showSuccess("Cover image updated successfully");
        handleClose();
      } else {
        showError(result.error || "Failed to update cover image");
      }
    } catch (error) {
      showError(error, "Failed to upload cover image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await removeCoverImage({});
      showSuccess("Cover image removed");
      handleClose();
    } catch (error) {
      showError(error, "Failed to remove cover image");
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
      title="Upload Cover Image"
      description="Choose a cover image for your profile"
      size="md"
    >
      <Stack gap="lg">
        {/* Preview */}
        <Card
          padding="none"
          radius="md"
          variant={displayImage ? "flat" : "outline"}
          className="relative h-32 overflow-hidden border-dashed"
        >
          <div className="h-full w-full">
            {displayImage ? (
              <img src={displayImage} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <Flex align="center" justify="center" className="h-full">
                <Typography variant="caption" color="tertiary">
                  No cover image
                </Typography>
              </Flex>
            )}
          </div>
          {displayImage && (
            <IconButton
              variant="solid"
              size="sm"
              className="absolute bottom-2 right-2 backdrop-blur-sm"
              onClick={() => fileInputRef.current?.click()}
              tooltip="Choose another cover image"
            >
              <Camera className="h-4 w-4" />
            </IconButton>
          )}
        </Card>

        <ImageUploadDropzone
          acceptedTypes={ACCEPTED_TYPES}
          fileInputRef={fileInputRef}
          helperText="JPG, PNG, GIF or WebP. Recommended: 1500x500px."
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
