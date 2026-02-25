import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";
import { Flex } from "./Flex";

// =============================================================================
// AlertDialog - Clean API with required title/description
// =============================================================================

interface AlertDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title (required for accessibility) */
  title: string;
  /** Dialog description (required for accessibility) */
  description: string;
  /** Dialog content (optional - description is often enough) */
  children?: React.ReactNode;
  /** Additional class for the dialog panel */
  className?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Action button text */
  actionLabel: string;
  /** Action button variant */
  actionVariant?: "primary" | "danger";
  /** Callback when action button is clicked */
  onAction: () => void;
  /** Whether action is in progress */
  isLoading?: boolean;
  /** Test ID for the dialog */
  "data-testid"?: string;
}

/**
 * AlertDialog component with enforced accessibility.
 * Used for confirmations that require user action.
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Item"
 *   description="This action cannot be undone."
 *   actionLabel="Delete"
 *   actionVariant="danger"
 *   onAction={handleDelete}
 * />
 * ```
 */
function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  cancelLabel = "Cancel",
  actionLabel,
  actionVariant = "primary",
  onAction,
  isLoading = false,
  "data-testid": testId,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ui-bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:opacity-0 transition-opacity duration-fast" />
        <AlertDialogPrimitive.Content
          data-testid={testId}
          className={cn(
            "bg-ui-bg fixed top-1/2 left-1/2 z-50 grid w-full max-w-dialog-mobile -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-ui-border p-6 shadow-elevated sm:max-w-lg origin-center [perspective:800px] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
            className,
          )}
        >
          {/* Header */}
          <Flex direction="column" gap="sm" className="text-center sm:text-left">
            <AlertDialogPrimitive.Title className="text-lg leading-none font-semibold tracking-tight text-ui-text">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-ui-text-secondary text-sm">
              {description}
            </AlertDialogPrimitive.Description>
          </Flex>

          {/* Optional additional content */}
          {children}

          {/* Footer with actions */}
          <Flex className="flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4">
            <AlertDialogPrimitive.Cancel
              disabled={isLoading}
              className={cn(buttonVariants({ variant: "secondary" }), "mt-2 sm:mt-0")}
            >
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={onAction}
              disabled={isLoading}
              className={cn(
                buttonVariants({ variant: actionVariant === "danger" ? "danger" : "primary" }),
              )}
            >
              {actionLabel}
            </AlertDialogPrimitive.Action>
          </Flex>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

// =============================================================================
// AlertDialogTrigger - For uncontrolled usage
// =============================================================================

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

export { AlertDialog, AlertDialogTrigger };
