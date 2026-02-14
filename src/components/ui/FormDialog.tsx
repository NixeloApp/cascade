import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Flex } from "./Flex";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void | Promise<void>;
  title: string;
  description?: string;
  children: ReactNode;
  saveLabel?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Reusable form dialog component
 * Standardizes the pattern used across all Manager components
 */
export function FormDialog({
  open,
  onOpenChange,
  onSave,
  title,
  description,
  children,
  saveLabel = "Save",
  isLoading = false,
  size = "md",
}: FormDialogProps) {
  const handleSave = async () => {
    await onSave();
  };

  // Map size prop to Tailwind classes
  const sizeClassMap = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description || "Form dialog"}
      className={sizeClassMap[size]}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 transition-all duration-default"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            isLoading={isLoading}
            className="focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 transition-all duration-default"
          >
            {saveLabel}
          </Button>
        </>
      }
    >
      <Flex direction="column" gap="lg" className="py-2">
        {children}
      </Flex>
    </Dialog>
  );
}
