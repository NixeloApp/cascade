import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { Paperclip } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";
import { Icon } from "./Icon";
import { Typography } from "./Typography";

const dropzoneVariants = cva(
  "w-full cursor-pointer rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors duration-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
  {
    variants: {
      state: {
        default:
          "border-ui-border bg-transparent hover:border-ui-border-secondary hover:bg-ui-bg-hover",
        active: "border-brand bg-ui-bg-hover",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

interface FileUploadDropzoneProps {
  acceptedTypes?: string[];
  actionLabel?: string;
  ariaLabel: string;
  description: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  helperText?: string;
  isDragging: boolean;
  isUploading?: boolean;
  multiple?: boolean;
  onDragLeave: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: React.DragEvent<HTMLButtonElement>) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploadDropzone({
  acceptedTypes,
  actionLabel = "Choose Files",
  ariaLabel,
  description,
  fileInputRef,
  helperText,
  isDragging,
  isUploading = false,
  multiple = true,
  onDragLeave,
  onDragOver,
  onDrop,
  onInputChange,
}: FileUploadDropzoneProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes?.join(",")}
        multiple={multiple}
        onChange={onInputChange}
        className="hidden"
        tabIndex={-1}
      />
      <button
        type="button"
        aria-label={ariaLabel}
        className={cn(dropzoneVariants({ state: isDragging ? "active" : "default" }))}
        onClick={() => fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <span className="flex flex-col items-center gap-2">
          <Icon icon={Paperclip} size="xl" className="mx-auto text-ui-text-tertiary" />
          <Typography variant="muted">{description}</Typography>
          {helperText && (
            <Typography variant="caption" color="tertiary">
              {helperText}
            </Typography>
          )}
          <span className="pointer-events-none" aria-hidden="true">
            <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                actionLabel
              )}
            </span>
          </span>
        </span>
      </button>
    </>
  );
}
