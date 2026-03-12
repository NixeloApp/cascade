import { Upload } from "lucide-react";
import type * as React from "react";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { Stack } from "./Stack";
import { Typography } from "./Typography";

interface ImageUploadDropzoneProps {
  acceptedTypes: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  helperText: string;
  isDragging: boolean;
  maxSizeLabel: string;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploadDropzone({
  acceptedTypes,
  fileInputRef,
  helperText,
  isDragging,
  maxSizeLabel,
  onDragLeave,
  onDragOver,
  onDrop,
  onInputChange,
}: ImageUploadDropzoneProps) {
  return (
    <Card
      padding="lg"
      variant={isDragging ? "soft" : "outline"}
      radius="md"
      hoverable={!isDragging}
      className="cursor-pointer border-dashed text-center"
      onClick={() => fileInputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={onInputChange}
        className="hidden"
      />
      <Stack gap="sm" align="center">
        <Icon icon={Upload} size="xl" className="text-ui-text-tertiary" />
        <Typography variant="small" color="secondary">
          Drag and drop an image, or click to browse
        </Typography>
        <Typography variant="caption" color="tertiary">
          {helperText} Max {maxSizeLabel}.
        </Typography>
      </Stack>
    </Card>
  );
}
